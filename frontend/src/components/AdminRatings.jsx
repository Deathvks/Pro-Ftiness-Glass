import React, { useState, useEffect } from 'react';
import { getAppRatings } from '../services/ratingService';
import Spinner from './Spinner';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AdminRatings() {
    const getAvatarUrl = (user) => {
        if (!user) return null;
        const path = user.profile_image_url;
        if (!path) return null;
        if (path.startsWith('http')) return path;
        if (path.startsWith('blob:')) return path;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${SERVER_URL}${cleanPath}`;
    };

    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const data = await getAppRatings();
                setRatings(data);
            } catch (error) {
                console.error("Error fetching ratings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRatings();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center py-12"><Spinner size={32} /></div>;
    }

    const averageRating = ratings.length ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) : 0;
    const totalPages = Math.ceil(ratings.length / ITEMS_PER_PAGE);
    const currentRatings = ratings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="w-full text-left">
            <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-text-primary mb-2">Valoraciones de la App</h2>
                <p className="text-text-secondary font-medium text-sm">Feedback general de los usuarios.</p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5 mb-8 text-sm text-text-primary">
                <h4 className="font-bold text-accent mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ¿Cómo funciona el sistema de valoraciones?
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 opacity-90">
                    <li>Se dispara automáticamente <b>todos los lunes a partir de las 10:00 AM</b> al abrir la app.</li>
                    <li>Si el usuario usa la <b>App Nativa</b>, se le mostrará la ventana oficial de Google Play (In-App Review).</li>
                    <li>Si usa la <b>Web o PWA</b>, le aparecerá nuestro modal de 1 a 5 estrellas.</li>
                    <li>Si la <b>valora</b>, el sistema lo recordará y <b>nunca más se le volverá a preguntar</b>.</li>
                    <li>Si la <b>rechaza o la cierra</b>, se le dejará en paz durante esa semana y se le volverá a pedir 7 días después.</li>
                </ul>
            </div>

            <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 ring-1 ring-black/5 dark:ring-white/10 mb-8 flex items-center gap-6">
                <div className="text-center">
                    <div className="text-5xl font-black text-text-primary mb-1">{averageRating}</div>
                    <div className="flex text-accent mb-1 justify-center">
                        {[1,2,3,4,5].map(s => s <= Math.round(averageRating) ? <StarIcon key={s} className="w-4 h-4" /> : <StarOutline key={s} className="w-4 h-4 text-text-muted" />)}
                    </div>
                    <div className="text-xs text-text-secondary font-bold">{ratings.length} valoraciones</div>
                </div>
                <div className="flex-1 space-y-2">
                    {[5,4,3,2,1].map(star => {
                        const count = ratings.filter(r => r.rating === star).length;
                        const percentage = ratings.length ? (count / ratings.length) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                                <span>{star}</span>
                                <StarIcon className="w-3 h-3 text-accent" />
                                <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <span className="w-8 text-right">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ratings.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-muted bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
                        <p className="font-bold text-lg">No hay valoraciones todavía.</p>
                    </div>
                ) : (
                    currentRatings.map(rating => (
                        <div key={rating.id} className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getAvatarUrl(rating.User) ? (
                                        <img src={getAvatarUrl(rating.User)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-black/5 dark:ring-white/10 shadow-sm bg-bg-primary" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold">{rating.User?.username?.charAt(0).toUpperCase() || 'U'}</div>
                                    )}
                                    <div>
                                        <div className="font-bold text-sm text-text-primary">@{rating.User?.username || 'Usuario'}</div>
                                        <div className="text-[10px] text-text-muted font-mono">{formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true, locale: es })}</div>
                                    </div>
                                </div>
                                <div className="flex text-accent shrink-0">
                                    {[1,2,3,4,5].map(s => s <= rating.rating ? <StarIcon key={s} className="w-4 h-4" /> : <StarOutline key={s} className="w-4 h-4 text-text-muted" />)}
                                </div>
                            </div>
                            {rating.comment && (
                                <p className="text-sm text-text-secondary bg-bg-primary/50 p-3 rounded-2xl ring-1 ring-black/5 dark:ring-white/10">{rating.comment}</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-2 mt-6">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-3 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-text-primary" />
                    </button>
                    <span className="text-sm font-bold text-text-secondary">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        <ChevronRightIcon className="w-5 h-5 text-text-primary" />
                    </button>
                </div>
            )}
        </div>
    );
}


