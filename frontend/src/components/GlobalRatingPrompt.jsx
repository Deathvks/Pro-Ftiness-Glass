import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapgoInAppReview } from '@capgo/capacitor-in-app-review';
import AppRatingModal from './AppRatingModal';

const GlobalRatingPrompt = () => {
    const [showWebModal, setShowWebModal] = useState(false);

    useEffect(() => {
        const checkRatingPrompt = async () => {
            // Wait a few seconds so it doesn't interrupt app launch immediately
            await new Promise(resolve => setTimeout(resolve, 5000));

            const hasRated = localStorage.getItem('has_rated_app');
            if (hasRated === 'true') return;

            const now = new Date();
            // Monday = 1, 10:00 AM
            // Check if it's past Monday 10:00 AM in the current week
            // Or simply prompt if it's Monday and hour is >= 10
            
            // Simpler: Check if it's Monday (1) and hour is 10 or more. 
            // Also ensure we only ask once a week max (if they say "later")
            
            const lastPromptTimestamp = localStorage.getItem('last_rating_prompt_time');
            if (lastPromptTimestamp) {
                const daysSinceLastPrompt = (now.getTime() - parseInt(lastPromptTimestamp)) / (1000 * 3600 * 24);
                // If we asked them less than 6 days ago, don't ask again
                if (daysSinceLastPrompt < 6) return;
            }

            const isMonday = now.getDay() === 1;
            const isAfter10 = now.getHours() >= 10;
            const isTuesdayToSunday = now.getDay() !== 1 && now.getDay() !== 0; 
            
            // If it's Monday after 10 AM, or any day in the middle of the week (if they haven't seen it this week)
            if ((isMonday && isAfter10) || isTuesdayToSunday) {
                
                // Show prompt!
                localStorage.setItem('last_rating_prompt_time', now.getTime().toString());

                if (Capacitor.isNativePlatform()) {
                    try {
                        await CapgoInAppReview.requestReview();
                        // Assume they rated, so we don't bother them again. Native API handles its own quotas anyway.
                        localStorage.setItem('has_rated_app', 'true');
                    } catch (error) {
                        console.error('InAppReview error:', error);
                        // Fallback to our custom modal just in case
                        setShowWebModal(true);
                    }
                } else {
                    // Show custom web modal
                    setShowWebModal(true);
                }
            }
        };

        checkRatingPrompt();
    }, []);

    return (
        <AppRatingModal 
            visible={showWebModal} 
            onClose={() => setShowWebModal(false)} 
        />
    );
};

export default GlobalRatingPrompt;

