// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import supabase from '../../db/supabase-client';
// import DrinkDetail from './DrinkDetail';

// const DrinkDetailPage = () => {
//     const { drinkId } = useParams();
//     const [drinkDetails, setDrinkDetails] = useState(null);

//     useEffect(() => {
//         async function fetchDrinkDetails() {
//             try {
//                 const { data, error } = await supabase
//                     .from('drinks')
//                     .select('*')
//                     .eq('id', drinkId)
//                     .single();

//                 if (error) throw error;
//                 setDrinkDetails(data);
//             } catch (error) {
//                 console.error('Error fetching drink details:', error.message);
//             }
//         }

//         fetchDrinkDetails();
//     }, [drinkId]);

//     if (!drinkDetails) return <p>Loading drink details...</p>;

//     return (
//         <DrinkDetail
//             name={drinkDetails.name}
//             description={drinkDetails.description}
//             imageUrl={drinkDetails.imageUrl}
//             calories={drinkDetails.calories}
//             price={drinkDetails.price}
//         />
//     );
// };

// export default DrinkDetailPage;