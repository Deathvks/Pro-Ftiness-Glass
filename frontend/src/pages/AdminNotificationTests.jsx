import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ClipboardCheck, Mail, ShieldCheck } from 'lucide-react';
import {
  getEmailUnsubscribeTestStatus, sendEmailMailboxTest, sendEmailUnsubscribeTest,
  getNotificationTestStatus, getNotificationReview, updateNotificationReview, sendPushDeviceTest
} from '../services/adminService';
import { getCurrentPushEndpoint, getPushPreferences, getPushSubscriptionStatus } from '../services/notificationService';
import { PUSH_OPTIONS } from '../config/pushConsent';
import CustomSelect from '../components/CustomSelect';

const PUSH_TEST_OPTIONS = [
  { value: 'service', label: 'Aviso de servicio' },
  ...PUSH_OPTIONS.map(({ purpose, title }) => ({ value: purpose, label: title })),
];

const EmailMailboxTest = () => {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const sendTest = async () => {
    setBusy(true);
    setResults([]);
    setError(null);
    try {
      const response = await sendEmailMailboxTest();
      setResults(response.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-6 space-y-4 rounded-2xl border border-glass-border bg-black/5 p-4 dark:bg-white/5 sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-black text-text-primary">
        <Mail size={20} className="shrink-0 text-accent" aria-hidden="true" />
        Prueba SMTP de los tres buzones
      </h2>
      <p className="text-sm text-text-secondary">
        Envía un mensaje a cada buzón de profitnessglass.es: notificaciones, soporte y privacidad.
      </p>
      <button
        type="button"
        onClick={sendTest}
        disabled={busy}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-contrast disabled:opacity-50"
      >
        {busy ? 'Enviando pruebas…' : 'Enviar prueba a los tres buzones'}
      </button>
      {results.length > 0 && (
        <div role="status" className="space-y-2 text-sm text-text-secondary">
          <ul className="space-y-1">
            {results.map(({ email, accepted }) => (
              <li key={email}>
                <strong className="break-all text-text-primary">{email}</strong> · {accepted ? 'Aceptado por SMTP' : 'Envío fallido'}
              </li>
            ))}
          </ul>
          <p>Abre los buzones en DonDominio para comprobar la recepción.</p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
};

const EmailUnsubscribeTest = ({ onOpenSettings }) => {
  const categories = { training: 'Entrenamiento', activity: 'Actividad', coaching: 'Asesoría' };
  const [category, setCategory] = useState('training');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(true);
  const [sentTo, setSentTo] = useState(null);
  const [error, setError] = useState(null);
  const [refreshMessage, setRefreshMessage] = useState('');

  const refreshStatus = useCallback(async (announce = false) => {
    setBusy(true);
    setError(null);
    setRefreshMessage('');
    try {
      setStatus(await getEmailUnsubscribeTestStatus());
      if (announce) setRefreshMessage('Preferencias actualizadas.');
    } catch (err) {
      setStatus(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const sendTest = async () => {
    setBusy(true);
    setError(null);
    setSentTo(null);
    setRefreshMessage('');
    try {
      const result = await sendEmailUnsubscribeTest(category, !status?.[category]);
      if (result.skipped) {
        setRefreshMessage(`Bloqueo comprobado para ${categories[category].toLowerCase()}. No se envió ningún correo.`);
      } else if (result.checkedOnly) {
        setRefreshMessage('La categoría está activa. Actualiza las preferencias y confirma la baja antes de repetir la comprobación.');
      } else {
        setSentTo(result.email);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-6 space-y-4 rounded-2xl border border-glass-border bg-black/5 p-4 dark:bg-white/5 sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-black text-text-primary">
        <Mail size={20} className="shrink-0 text-accent" aria-hidden="true" />
        Prueba de baja de correo
      </h2>
      <p className="text-sm text-text-secondary">
        Elige una categoría. Envía un correo a tu cuenta de administrador, confirma la baja desde el mensaje y repite la prueba para comprobar que el envío se omite.
      </p>
      {status && (
        <div className="space-y-2 text-sm text-text-secondary">
          <p>Destinatario <strong className="break-all text-text-primary">{status.email}</strong></p>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div><dt className="inline">Entrenamiento </dt><dd className="inline font-bold">{status.training ? 'Activo' : 'Inactivo'}</dd></div>
            <div><dt className="inline">Actividad </dt><dd className="inline font-bold">{status.activity ? 'Activa' : 'Inactiva'}</dd></div>
            <div><dt className="inline">Asesoría </dt><dd className="inline font-bold">{status.coaching ? 'Activa' : 'Inactiva'}</dd></div>
          </dl>
          {!status.verified ? (
            <p>Verifica el correo de tu cuenta antes de hacer la prueba.</p>
          ) : !status[category] && !sentTo && (
            <p>Esta categoría está desactivada. Puedes comprobar el bloqueo ahora o activarla en Ajustes para probar el enlace de baja.</p>
          )}
        </div>
      )}
      <label className="block text-sm font-semibold text-text-primary">
        Categoría
        <select value={category} disabled={busy} onChange={event => {
          setCategory(event.target.value);
          setSentTo(null);
          setRefreshMessage('');
          setError(null);
        }} className="mt-1 block w-full max-w-xs rounded-xl border border-glass-border bg-bg-secondary p-2 text-sm">
          {Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={sendTest}
          disabled={busy || !status?.verified}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-contrast disabled:opacity-50"
        >
          {status?.[category] ? 'Enviar correo de prueba' : 'Ejecutar prueba de bloqueo'}
        </button>
        <button
          type="button"
          onClick={() => refreshStatus(true)}
          disabled={busy}
          className="rounded-xl border border-glass-border px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-50"
        >
          Actualizar estado de preferencias
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-xl border border-glass-border px-4 py-2 text-sm font-bold text-text-primary"
        >
          Ir a Ajustes de notificaciones
        </button>
      </div>
      <p role="status" className="text-sm text-text-secondary empty:sr-only">{refreshMessage}</p>
      {sentTo && (
        <p role="status" className="text-sm text-text-secondary">
          El servidor de correo aceptó el mensaje para <strong className="break-all text-text-primary">{sentTo}</strong>.
          Abre el mensaje en tu buzón, pulsa «Darse de baja de estos correos» y confirma la baja.
          Vuelve aquí, actualiza el estado y ejecuta la prueba de bloqueo de la misma categoría.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
};

const sectionClass = 'space-y-4 rounded-2xl border border-glass-border bg-black/5 p-4 dark:bg-white/5 sm:p-5';
const actionClass = 'rounded-xl border border-glass-border px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-50';

const environmentChecks = [
  ['mx', 'MX de DonDominio'], ['spf', 'SPF de DonDominio'], ['dkim', 'Clave DKIM de DonDominio'], ['dmarc', 'Registro DMARC'],
  ['smtp', 'SMTP DonDominio configurado en el backend'], ['frontendUrl', 'URL de Zeabur para los enlaces de correo'],
  ['webPush', 'Variables VAPID presentes'], ['androidPush', 'Firebase Admin inicializado']
];

const reviewChecks = [
  { id: 'inboxes', title: 'Recepción y autenticación del correo', description: 'Comprueba los tres buzones. En las cabeceras del correo recibido revisa el remitente, Reply-To y los resultados de SPF, DKIM y DMARC.' },
  { id: 'registration', title: 'Registro y verificación', description: 'Abre /register en una ventana privada. Crea una cuenta con una dirección real tuya, deja las opciones de correo sin marcar y verifica el código recibido.' },
  { id: 'recovery', title: 'Recuperación de contraseña', description: 'Usa Olvidé mi contraseña con tu cuenta de prueba. Confirma que el enlace recibido abre la app y permite cambiar la contraseña.' },
  { id: 'twoFactor', title: 'Código de inicio de sesión en dos pasos', description: 'En tu cuenta de prueba, activa el segundo factor por correo. Inicia sesión y comprueba que el código recibido permite entrar.' },
  { id: 'emailOptOut', title: 'Baja y bloqueo por correo', description: 'Repite la prueba de baja para entrenamiento, actividad y asesoría. Comprueba que se bloquea la categoría retirada y que las demás conservan su estado.' },
  { id: 'browser', title: 'Push web en un navegador real', description: 'Comprueba la recepción de servicio, prueba las categorías opcionales activadas y repite tras retirarlas. Apaga el push del dispositivo y vuelve a comprobar su estado.' },
  { id: 'android', title: 'Push y recordatorios locales en un Android real', description: 'Repite la prueba en la app instalada. Comprueba en segundo plano que los recordatorios locales se programan al activarlos y se cancelan al apagarlos.' },
  { id: 'donDominio', title: 'Acuerdo de tratamiento de DonDominio', description: 'Archiva la constancia del plan Mini contratado y la copia de las condiciones aplicables con el Anexo I.', url: 'https://www.dondominio.com/es/legal/7/condiciones-particulares-del-servicio-de-alojamiento-compartido/' },
  { id: 'firebase', title: 'Condiciones y transferencias del servicio push', description: 'Identifica el proyecto Firebase de producción, las condiciones aplicables y las garantías de transferencia. Documenta también los proveedores de push web que utilices.', url: 'https://firebase.google.com/terms/data-processing-terms' },
  { id: 'activityBasis', title: 'Avisos de actividad activados por defecto', description: 'Archiva la decisión sobre el interés legítimo. Justifica el uso y la frecuencia del correo frente a los avisos dentro de la app y valora el impacto en usuarios menores.' },
  { id: 'emailRetention', title: 'Conservación de los registros de correo', description: 'Documenta el plazo necesario para diagnosticar entregas y cómo se aplica el borrado de los registros de correo.' }
];

function EnvironmentTests() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    setBusy(true);
    setError('');
    try {
      setStatus(await getNotificationTestStatus());
    } catch (err) {
      setStatus(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={sectionClass}>
      <h2 className="flex items-center gap-2 font-black text-text-primary"><ShieldCheck size={20} className="text-accent" /> DNS y configuración</h2>
      <p className="text-sm text-text-secondary">Consulta los registros de profitnessglass.es y la configuración del servidor. La entrega se comprueba con las pruebas de envío.</p>
      <button type="button" onClick={check} disabled={busy} className={actionClass}>{busy ? 'Comprobando…' : 'Comprobar configuración'}</button>
      {status && <dl className="grid gap-2 text-sm sm:grid-cols-2" aria-live="polite">
        {environmentChecks.map(([key, title]) => <div key={key} className="rounded-xl border border-glass-border p-3">
          <dt className="text-text-secondary">{title}</dt>
          <dd className="font-bold text-text-primary">{status[key] === true ? 'Detectado' : status[key] === false ? 'Sin detectar' : 'Consulta no disponible'}</dd>
        </div>)}
      </dl>}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
}

function PushDeviceTest({ onOpenSettings }) {
  const [purpose, setPurpose] = useState('service');
  const [device, setDevice] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async send => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const endpoint = await getCurrentPushEndpoint();
      const [prefs, subscription] = await Promise.all([
        getPushPreferences(),
        endpoint ? getPushSubscriptionStatus(endpoint) : null
      ]);
      setPreferences(prefs);
      setDevice(!!subscription?.subscribed);
      if (send && endpoint && subscription?.subscribed) {
        setResult(await sendPushDeviceTest(endpoint, purpose));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deliveryMessages = {
    success: 'El proveedor aceptó el push. Comprueba si aparece en este dispositivo.',
    skipped: 'Push omitido por las preferencias de esta cuenta.',
    no_subscription: 'Este dispositivo ya no tiene una suscripción push activa.',
    error: 'El proveedor no confirmó la entrega push.'
  };

  return (
    <section className={sectionClass}>
      <h2 className="flex items-center gap-2 font-black text-text-primary"><Bell size={20} className="text-accent" /> Prueba push de este dispositivo</h2>
      <p className="text-sm text-text-secondary">Abre este panel en el navegador o Android que quieras probar. Activa el push del dispositivo desde Ajustes. Para probar una baja opcional, retira esa categoría en Ajustes y repite el envío.</p>
      <div className="w-full max-w-xs space-y-1">
        <label htmlFor="push-test-category" className="block text-sm font-semibold text-text-primary">Categoría</label>
        <CustomSelect
          id="push-test-category"
          value={purpose}
          options={PUSH_TEST_OPTIONS}
          onChange={value => { setPurpose(value); setResult(null); }}
          disabled={busy}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => run(false)} disabled={busy} className={actionClass}>Comprobar dispositivo</button>
        <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-contrast disabled:opacity-50">{busy ? 'Comprobando…' : 'Ejecutar prueba push'}</button>
        <button type="button" onClick={onOpenSettings} className={actionClass}>Ir a Ajustes</button>
      </div>
      {device !== null && <div role="status" className="space-y-1 text-sm text-text-secondary">
        <p>{device ? 'Este dispositivo está vinculado a tu cuenta.' : 'Este dispositivo no tiene push activo para tu cuenta.'}</p>
        {purpose !== 'service' && preferences && <p>Permiso de la categoría {preferences[purpose] ? 'activo' : 'inactivo'}.</p>}
        {result && <p>{deliveryMessages[result.pushStatus]}</p>}
      </div>}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
}

function NotificationReview() {
  const [review, setReview] = useState(null);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setReview(await getNotificationReview()); }
    catch (err) { setError(err.message); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const mark = async (check, reviewed) => {
    setSaving(check);
    setError('');
    try {
      const { entry } = await updateNotificationReview(check, reviewed);
      setReview(previous => ({ ...previous, [check]: entry }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className={sectionClass}>
      <h2 className="flex items-center gap-2 font-black text-text-primary"><ClipboardCheck size={20} className="text-accent" /> Comprobaciones manuales y documentación</h2>
      <p className="text-sm text-text-secondary">Marca cada comprobación después de realizarla. El panel guarda la fecha de revisión. Conserva las pruebas y los acuerdos en tu archivo interno.</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {reviewChecks.map(({ id, title, description, url }) => <li key={id} className="rounded-xl border border-glass-border p-3 text-sm">
          <label className="flex items-start gap-2 font-semibold text-text-primary">
            <input type="checkbox" className="mt-1 shrink-0 accent-current" checked={!!review?.[id]} disabled={!review || !!saving} onChange={event => mark(id, event.target.checked)} />
            {title}
          </label>
          <p className="mt-1 text-text-secondary">{description}</p>
          {url && <a className="mt-1 inline-block text-xs font-semibold text-accent underline" href={url} target="_blank" rel="noreferrer">Consultar condiciones</a>}
          {review?.[id]?.reviewedAt && <p className="mt-1 text-xs text-text-secondary">Revisado el {new Date(review[id].reviewedAt).toLocaleString('es-ES')}</p>}
        </li>)}
      </ul>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {!review && error && <button type="button" onClick={load} className={actionClass}>Volver a cargar</button>}
    </section>
  );
}

export default function AdminNotificationTests({ onOpenSettings }) {
  return (
    <div className="space-y-5">
      <EnvironmentTests />
      <div className="grid gap-x-5 lg:grid-cols-2">
        <EmailMailboxTest />
        <EmailUnsubscribeTest onOpenSettings={onOpenSettings} />
      </div>
      <PushDeviceTest onOpenSettings={onOpenSettings} />
      <NotificationReview />
    </div>
  );
}
