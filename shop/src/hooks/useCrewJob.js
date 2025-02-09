import axios from 'axios';
import { useState, useEffect } from 'react';
import toast from "react-hot-toast";
/**
 * @typedef {Object} DrinkInfo
 * @property {string} name - The name of the drink
 * @property {string[]} ingredient - List of ingredients
 * @property {string} recommendation - Drink recommendation
 */

/**
 * @typedef {Object} EventType
 * @property {string} data 
 * @property {string} timestamp 
 */

/**
 * @typedef {Object} ResultType
 * @property {DrinkInfo[]} DrinkInfo - List of drink information
 */

/**
 * @typedef {Object} ResponseData
 * @property {string} status 
 * @property {ResultType} result 
 * @property {EventType[]} events 
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useCrewJob = () => {
    // State 
    const [running, setRunning] = useState(false)
    /** @type {String[]} */
    const [userInput, setUserInput] = useState([]);
    /** @type {String[]} */
    const [userPreference, setUserPreference] = useState([]);
    /** @type {EventType[]} */
    const [events, setEvents] = useState([]);
    /** @type {DrinkInfo[]} */
    const [drinkInfo, setDrinkInfo] = useState([]);
    const [currentJobId, setCurrentJobId] = useState('');
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    useEffect(() => {
        let intervalId;
        const fetchJobStatus = async () => {
            try {
                console.log("API_URL: ", API_URL);
                const response = await axios.get(`${API_URL}/api/drink/${currentJobId}`, config);
                const { status, result, events: fetchedEvents } = response.data;

                // Update events only if we have new ones
                if (fetchedEvents && fetchedEvents.length > 0) {
                    setEvents(fetchedEvents);
                }

                if (result) {
                    console.log("Received result:", result);
                    setDrinkInfo([result]);
                }
                if (status === "SUCCESS" || status === "ERROR") {
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                    setRunning(false);
                    toast.success("Job completed.");
                }
            } catch (error) {
                clearInterval(intervalId);
                console.error("Job Fetch Failed: ", error);
                if (error.response?.status === 404) {
                    setCurrentJobId("");
                    toast.error("Job not found");
                } else {
                    toast.error("Failed to fetch job status");
                }
            }
        };

        if (currentJobId !== "") {
            intervalId = setInterval(fetchJobStatus, 1000);
            // Add cleanup
            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            };
        }
    }, [currentJobId]);

    const startJob = async () => {
        // clean up old job
        setEvents([]);
        setDrinkInfo([]);
        setRunning(true);
        // request backend
        try {
            const response = await axios.post(`${API_URL}/api/drink`, {
                'user-preference': userInput,
                'user-input': userPreference,
            }, config);
            // update the state (job_id, etc.)
            toast.success("Job started.")
            console.log("Job started: ", response.data)
            setCurrentJobId(response.data.job_id)
            setDrinkInfo(response.data.DrinkInfo)
        } catch (error) {
            toast.error("Job failed to start.")
            console.log("Job failed: ", error.response?.data);
            setCurrentJobId("");
            setRunning(false);  // Reset running state on error
        }

    }
    // Return 
    return {
        userInput,
        setUserInput,
        userPreference,
        setUserPreference,
        startJob,
        running,
        events,
        drinkInfo,
    }
};