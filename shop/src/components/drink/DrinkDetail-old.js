// import { useState } from 'react'
// import { ChevronLeft, ChevronDown, Plus, Minus, Check } from 'lucide-react'
// import { categories, milks, syrups } from './Drink-dbConstant'
// import { Link } from 'react-router-dom';
// import styled from "styled-components";
// // ListItem component to handle Milk and Syrup items dynamically
// const ListItem = ({ item, selected, setSelected, type }) => (
//     <div
//         className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#00754a] transition-all duration-200"
//         onClick={() => setSelected(item.id)}
//     >
//         <span className="text-gray-700">{item.name}</span>
//         {type === 'milk' && selected === item.id && (
//             <Check className="h-6 w-6 text-[#00754a]" />
//         )}
//         {type === 'syrup' && (
//             <div className="flex items-center">
//                 <button
//                     onClick={(e) => {
//                         e.stopPropagation();
//                         setSelected(Math.max(0, selected - 1));
//                     }}
//                     className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
//                 >
//                     <Minus className="h-5 w-5 text-[#00754a]" />
//                 </button>
//                 <span className="mx-4 font-semibold text-gray-900">{selected}</span>
//                 <button
//                     onClick={(e) => {
//                         e.stopPropagation();
//                         setSelected(selected + 1)
//                     }}
//                     className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
//                 >
//                     <Plus className="h-6 w-6 text-[#00754a]" />
//                 </button>
//             </div>
//         )}
//     </div>
// )

// const HeroSection = styled.section`
//     background: linear-gradient(to bottom, #0a0c2c80 3rem, transparent 10rem),
//     background-position: center, bottom left;
//     background-size: cover, cover;
//     height: fit-content;
//     color: #fafafc;
// `
// export default function Component() {
//     const [expandedCategory, setExpandedCategory] = useState(null)
//     const [syrupPumps, setSyrupPumps] = useState({})
//     const [selectedMilk, setSelectedMilk] = useState(null)
//     const toggleCategory = (categoryId) => {
//         setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
//     }
//     const adjustSyrupPumps = (syrupId, change) => {
//         setSyrupPumps(prev => ({
//             ...prev,
//             [syrupId]: Math.max(0, (prev[syrupId] || 0) + change)
//         }))
//     }

//     return (
//         <div className="max-w-7xl mx-auto">
//             {/* Breadcrumb Navigation */}
//             <nav className="p-4 text-sm">
//                 <div className="flex items-center gap-2 text-gray-600">
//                     <Link href="./DrinkMenu" className="hover:text-[#00754a]">Menu</Link>
//                     <span>/</span>
//                     <Link href="/menu/hot-coffees" className="hover:text-[#00754a]">Hot Coffees</Link>
//                     <span>/</span>
//                     <span className="text-gray-800">Caffè Americano</span>
//                 </div>
//             </nav>

//             {/* Hero Section */}
//             <HeroSection className="light hero"></HeroSection>
//             {/* <div className="flex items-center gap-8">
//                 <div className="relative">
//                     <img
//                         src="https://image-link"
//                         alt="Butterbeer Frappuccino"
//                         className="w-40 h-40 object-cover rounded-full shadow-xl transform hover:scale-105 transition-transform duration-300"
//                     />
//                     <div className="absolute inset-0 rounded-full shadow-inner"></div>
//                 </div>
//                 <div>
//                     <h1 className="text-4xl font-bold mb-3">Butterbeer Frappuccino</h1>
//                     <p className="text-xl text-gray-200">Grande (16 fl oz)</p>
//                 </div>
//             </div> */}
//             {/* 
//             <main className="bg-white rounded-b-lg shadow-lg p-6">
//                 {categories.map((category) => (
//                     <section key={category.id} className="mb-8">
//                         <h2 className="text-xl font-bold mb-4">{category.name}</h2>
//                         {category.id === 2 && (
//                             <div className="space-y-4 mb-4">
//                                 {syrups.map(syrup => (
//                                     <ListItem
//                                         key={syrup.id}
//                                         item={syrup}
//                                         selected={syrupPumps[syrup.id] || 0}
//                                         setSelected={change => adjustSyrupPumps(syrup.id, change)}
//                                         type="syrup"
//                                     />
//                                 ))}
//                             </div>
//                         )}
//                         {category.id === 1 && (
//                             <div className="space-y-2 mb-4">
//                                 {milks.map(milk => (
//                                     <ListItem
//                                         key={milk.id}
//                                         item={milk}
//                                         selected={selectedMilk}
//                                         setSelected={setSelectedMilk}
//                                         type="milk"
//                                     />
//                                 ))}
//                             </div>
//                         )}
//                         <div
//                             className="bg-gray-100 rounded-lg p-4 flex justify-between items-center cursor-pointer"
//                             onClick={() => toggleCategory(category.id)}
//                         >
//                             <span>{`Add ${category.name}`}</span>
//                             <ChevronDown className={`h-6 w-6 text-[#00754a] transform transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`} />
//                         </div>
//                         {expandedCategory === category.id && (
//                             <div className="mt-2 space-y-2">
//                                 <div className="bg-white rounded-lg p-3 flex justify-between items-center shadow">
//                                     <span>Option 1</span>
//                                     <Check className="h-5 w-5 text-[#00754a]" />
//                                 </div>
//                                 <div className="bg-white rounded-lg p-3 flex justify-between items-center shadow">
//                                     <span>Option 2</span>
//                                     <Check className="h-5 w-5 text-[#00754a] opacity-0" />
//                                 </div>
//                             </div>
//                         )}
//                     </section>
//                 ))}
//                 <button className="w-full bg-[#00754a] text-white py-4 rounded-full text-lg font-semibold mt-8 hover:bg-[#1e3932] transition-colors duration-300">
//                     Add to Order
//                 </button>
//             </main> */}
//         </div >
//     )
// }
