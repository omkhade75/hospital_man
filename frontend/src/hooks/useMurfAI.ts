/**
 * useMurfAI – Browser-side Murf AI Text-to-Speech utility
 *
 * Calls Murf's /v1/speech/generate REST endpoint with the project API key,
 * receives a temporary audio URL, and plays it in the browser using the
 * Web Audio API / HTMLAudioElement.
 *
 * Usage:
 *   const { speak, speaking, stop } = useMurfAI();
 *   await speak("Appointment booked! Stay safe.");
 */

import { useState, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const MURF_API_KEY = "ap2_f6a534a3-4401-42ea-b12c-151ce42547b3";

// Use Vite proxy in dev, direct URL in production.
// The Vite proxy config maps /api/murf → https://api.murf.ai
const MURF_API_URL =
    typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "/api/murf/v1/speech/generate"
        : "https://api.murf.ai/v1/speech/generate";

// A calm, clear English female voice available in Murf
const DEFAULT_VOICE_ID = "en-US-natalie"; // Natalie – US English female
const FALLBACK_VOICE_ID = "en-US-cooper"; // Cooper – US English male fallback

export type MurfVoiceId = string;

export interface MurfSpeakOptions {
    /** Text to synthesise */
    text: string;
    /** Override default voice */
    voiceId?: MurfVoiceId;
    /** Speaking rate  0.5 – 2.0  (default 1.0) */
    rate?: number;
    /** Pitch  -10 to 10 (default 0) */
    pitch?: number;
}

export interface UseMurfAIReturn {
    /** Speak the given text (non-blocking – fires and forgets unless you await) */
    speak: (textOrOptions: string | MurfSpeakOptions) => Promise<void>;
    /** Is audio currently playing? */
    speaking: boolean;
    /** Stop current playback immediately */
    stop: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useMurfAI(): UseMurfAIReturn {
    const [speaking, setSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    /** Stop any playing audio */
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setSpeaking(false);
    }, []);

    const speak = useCallback(
        async (textOrOptions: string | MurfSpeakOptions): Promise<void> => {
            const options: MurfSpeakOptions =
                typeof textOrOptions === "string"
                    ? { text: textOrOptions }
                    : textOrOptions;

            const {
                text,
                voiceId = DEFAULT_VOICE_ID,
                rate = 1.0,
                pitch = 0,
            } = options;

            // Stop previous playback
            stop();

            try {
                setSpeaking(true);

                // --- Call Murf REST API ---
                const response = await fetch(MURF_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "api-key": MURF_API_KEY,
                    },
                    body: JSON.stringify({
                        voiceId,
                        text,
                        rate,
                        pitch,
                        format: "MP3",
                        sampleRate: 24000,
                        channelType: "MONO",
                        encodeAsBase64: false,
                    }),
                });

                if (!response.ok) {
                    // Try fallback voice on 4xx voice-not-found errors
                    const fallbackResponse = await fetch(MURF_API_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "api-key": MURF_API_KEY,
                        },
                        body: JSON.stringify({
                            voiceId: FALLBACK_VOICE_ID,
                            text,
                            rate,
                            pitch,
                            format: "MP3",
                            sampleRate: 24000,
                            channelType: "MONO",
                            encodeAsBase64: false,
                        }),
                    });

                    if (!fallbackResponse.ok) {
                        throw new Error(`Murf API error: ${response.status}`);
                    }

                    const fallbackData = await fallbackResponse.json();
                    await _playAudioUrl(fallbackData.audioFile ?? fallbackData.audio_file ?? fallbackData.url, stop, setSpeaking);
                    return;
                }

                const data = await response.json();
                // The response contains audioFile (a temporary CDN URL)
                const audioUrl: string =
                    data.audioFile ?? data.audio_file ?? data.url ?? data.outputUrl;

                if (!audioUrl) {
                    throw new Error("Murf API returned no audio URL");
                }

                await _playAudioUrl(audioUrl, stop, setSpeaking);
            } catch (err) {
                console.warn("[MurfAI] Falling back to browser TTS:", err);
                // Graceful degradation → browser's built-in speech synthesis
                await _browserTTSFallback(text);
                setSpeaking(false);
            }
        },
        [stop]
    );

    return { speak, speaking, stop };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function _playAudioUrl(
    url: string,
    stop: () => void,
    setSpeaking: (v: boolean) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.onended = () => {
            setSpeaking(false);
            resolve();
        };
        audio.onerror = (e) => {
            setSpeaking(false);
            reject(e);
        };
        audio.play().catch(reject);
    });
}

async function _browserTTSFallback(text: string): Promise<void> {
    return new Promise((resolve) => {
        if (!("speechSynthesis" in window)) {
            resolve();
            return;
        }
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1.0;
        utt.pitch = 1.0;
        utt.onend = () => resolve();
        utt.onerror = () => resolve();
        window.speechSynthesis.speak(utt);
    });
}
