/* backend/controllers/squadController.js */
import models from '../models/index.js';
import crypto from 'crypto';

const { Squad, SquadMember, User } = models;

const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

export const createSquad = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { userId } = req.user;

    if (!name || name.length < 3) {
      return res.status(400).json({ error: 'El nombre de la tribu debe tener al menos 3 caracteres.' });
    }

    const newSquad = await Squad.create({
      name,
      description,
      admin_id: userId,
      invite_code: generateInviteCode()
    });

    await SquadMember.create({
      user_id: userId,
      squad_id: newSquad.id,
      role: 'admin'
    });

    res.status(201).json(newSquad);
  } catch (error) {
    console.error('Error al crear la tribu:', error);
    res.status(500).json({ error: 'Error al crear la tribu', details: error.message });
  }
};

export const joinSquad = async (req, res) => {
  try {
    const { invite_code } = req.body;
    const { userId } = req.user;

    const squad = await Squad.findOne({ where: { invite_code } });
    if (!squad) return res.status(404).json({ error: 'Código de invitación inválido' });

    const existing = await SquadMember.findOne({ where: { user_id: userId, squad_id: squad.id } });
    if (existing) return res.status(400).json({ error: 'Ya perteneces a esta tribu' });

    await SquadMember.create({ user_id: userId, squad_id: squad.id, role: 'member' });
    
    res.json({ message: 'Te has unido a la tribu', squad });
  } catch (error) {
    console.error('Error al unirse a la tribu:', error);
    res.status(500).json({ error: 'Error al unirse a la tribu', details: error.message });
  }
};

export const getMySquads = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const userWithSquads = await User.findByPk(userId, {
      include: [{ model: Squad, as: 'Squads' }]
    });

    res.json(userWithSquads ? userWithSquads.Squads : []);
  } catch (error) {
    console.error('Error al obtener tus tribus:', error);
    res.status(500).json({ error: 'Error al obtener tus tribus', details: error.message });
  }
};

export const getSquadLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;

    const squad = await Squad.findByPk(id, {
      include: [{
        model: User,
        as: 'Members',
        // CORRECCIÓN: 'last_active' -> 'lastSeen'
        attributes: ['id', 'username', 'profile_image_url', 'xp', 'streak', 'lastSeen'],
        through: { attributes: ['role'] }
      }]
    });

    if (!squad) return res.status(404).json({ error: 'Tribu no encontrada' });

    const sortedMembers = squad.Members.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    res.json({ ...squad.toJSON(), Members: sortedMembers });
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).json({ error: 'Error al obtener el ranking', details: error.message });
  }
};

export const leaveSquad = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const membership = await SquadMember.findOne({ where: { user_id: userId, squad_id: id } });
    
    if (!membership) {
        return res.status(400).json({ error: 'No perteneces a esta tribu' });
    }

    if (membership.role === 'admin') {
        return res.status(400).json({ error: 'Eres el creador. Debes eliminar la tribu en su lugar.' });
    }

    await membership.destroy();
    res.json({ message: 'Has abandonado la tribu' });
  } catch (error) {
    console.error('Error al abandonar la tribu:', error);
    res.status(500).json({ error: 'Error al abandonar la tribu', details: error.message });
  }
};

export const deleteSquad = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const squad = await Squad.findByPk(id);
    if (!squad) return res.status(404).json({ error: 'Tribu no encontrada' });

    if (squad.admin_id !== userId) {
        return res.status(403).json({ error: 'Solo el administrador puede eliminar la tribu' });
    }

    await squad.destroy();
    res.json({ message: 'Tribu eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la tribu:', error);
    res.status(500).json({ error: 'Error al eliminar la tribu', details: error.message });
  }
};