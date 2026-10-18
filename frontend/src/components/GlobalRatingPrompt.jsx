import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapgoInAppReview } from '@capgo/capacitor-in-app-review';
import AppRatingModal from './AppRatingModal';
import { getMyRating } from '../services/ratingService';

const DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 2 * DAY_MS;
const PROMPT_COOLDOWN_MS = 6 * DAY_MS;

const GlobalRatingPrompt = ({ userProfile, canShow = true }) => {
    const [showWebModal, setShowWebModal] = useState(false);

    useEffect(() => {
        const userId = userProfile?.id;
        const registeredAt = Date.parse(userProfile?.created_at || userProfile?.createdAt || '');
        if (!userId || !Number.isFinite(registeredAt)) return undefined;

        let timeoutId;
        let isCancelled = false;
        const ratedKey = `has_rated_app_${userId}`;
        const lastPromptKey = `last_rating_prompt_time_${userId}`;

        const checkPrompt = async () => {
            const eligibleAt = registeredAt + INITIAL_DELAY_MS;
            const untilEligible = eligibleAt - Date.now();
            if (untilEligible > 0) {
                timeoutId = setTimeout(checkPrompt, untilEligible);
                return;
            }

            // Keep this prompt behind every existing blocking modal and active workout.
            if (!canShow) return;

            if (localStorage.getItem(ratedKey) === 'true') return;

            try {
                const savedRating = await getMyRating();
                if (isCancelled) return;
                if (savedRating?.rating > 0) {
                    localStorage.setItem(ratedKey, 'true');
                    return;
                }
            } catch (error) {
                console.warn('No se pudo comprobar la valoración guardada:', error);
            }

            if (isCancelled) return;

            const lastPrompt = Number(localStorage.getItem(lastPromptKey) || 0);
            const cooldownRemaining = lastPrompt + PROMPT_COOLDOWN_MS - Date.now();
            if (lastPrompt && cooldownRemaining > 0) {
                timeoutId = setTimeout(checkPrompt, cooldownRemaining);
                return;
            }

            localStorage.setItem(lastPromptKey, String(Date.now()));

            if (Capacitor.isNativePlatform()) {
                try {
                    await CapgoInAppReview.requestReview();
                    if (!isCancelled) localStorage.setItem(ratedKey, 'true');
                } catch (error) {
                    console.error('InAppReview error:', error);
                    if (!isCancelled) setShowWebModal(true);
                }
                return;
            }

            setShowWebModal(true);
        };

        checkPrompt();
        return () => {
            isCancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [userProfile?.id, userProfile?.created_at, userProfile?.createdAt, canShow]);

    return (
        <AppRatingModal
            visible={showWebModal}
            userId={userProfile?.id}
            onClose={() => setShowWebModal(false)}
        />
    );
};

export default GlobalRatingPrompt;
