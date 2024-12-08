import styled from 'styled-components';
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import supabase from '../../db/supabase-client';
import DrinkHeroSection from '../ui/DrinkDetail-HeroSection'
import DrinkSection from './DrinkSection'

export default function DrinkDetail() {
    const { category, drinkId } = useParams(); // Get drinkId from URL
    const location = useLocation(); // Hook from react-router-dom
    const drinkData = location.state?.drinkData;
    console.log('Received drink data:', drinkData);
    const [loading, setLoading] = useState(true);
    const [drink, setDrink] = useState(drinkData || null);

    const categoryMap = {
        "coldcoffee": "Cold Coffee",
        "hotcoffee": "Hot Coffee",
        "icetea": "Iced Tea",
        "refresher": "Refresher"
    };

    useEffect(() => {
        if (drinkData) {
            console.log('Fetched drinkData:', drinkData);
            setLoading(false);
            return;
        }
        if (!drinkData) {
            async function fetchDrinkDetails() {
                try {
                    const { data, error } = await supabase
                        .from('menuitems')
                        .select('*')  // Select all fields you need
                        .eq('itemid', drinkId)
                        .single();
                    if (error) throw error;
                    const parsedDescriptions = typeof data.descriptions === 'string'
                        ? JSON.parse(data.descriptions)
                        : data.descriptions;
                    setDrink({ ...data, descriptions: parsedDescriptions });
                    // console.log("Combined drink details:", data);
                }
                catch (error) {
                    console.error('Error fetching drink details:', error.message);
                } finally {
                    setLoading(false);
                }
            }
            fetchDrinkDetails();
        }
    }, [drinkId, drinkData]);

    // console.log('Current state:', { drinkData });

    if (loading) {
        return <div>Loading...</div>;
    }
    if (!drink) {
        return <div>Drink not found</div>;
    }

    return (
        <div>
            <nav style={{ padding: '2rem', fontSize: '1.125rem', fontWeight: '600', color: '#4B5563' }}>
                <div className="flex items-center gap-2">
                    <Link to={`/menu/${category}`} style={{ fontWeight: '200', color: '#4B5563', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.color = '#00040a'} onMouseOut={(e) => e.currentTarget.style.color = '#4B5563'}>{categoryMap[drink.category]}</Link>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-800">{drink.name}</span>
                </div>
            </nav>

            <DrinkHeroSection
                drinkName={drink.name}
                image={drink.image}
                description={drink.general_description}
            />

            <div className="p-4">
                <DrinkSection drink={drink.descriptions} />
            </div>
        </div>

    )
}