import { useState } from 'react'
import { ChevronLeft, ChevronDown, Plus, Minus, Check } from 'lucide-react'
import { categories, milks, syrups } from './Drink-dbConstant'
import supabase from '../../db/supabase-client';
import { Field, Label, Radio, RadioGroup } from '@headlessui/react'

// ListItem component to handle Milk and Syrup items dynamically
const ListItem = ({ item, selected, setSelected, type }) => (
    <div
        className="bg-gray-100 rounded-lg p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setSelected(item.id)}
    >
        <span>{item.name}</span>
        {type === 'milk' && selected === item.id && <Check className="h-6 w-6 text-[#00754a]" />}
        {type === 'syrup' && (
            <div className="flex items-center">
                <button
                    onClick={() => setSelected(Math.max(0, selected - 1))}
                    className="bg-white rounded-full p-1 shadow"
                >
                    <Minus className="h-6 w-6 text-[#00754a]" />
                </button>
                <span className="mx-4 font-semibold">{selected}</span>
                <button
                    onClick={() => setSelected(selected + 1)}
                    className="bg-white rounded-full p-1 shadow"
                >
                    <Plus className="h-6 w-6 text-[#00754a]" />
                </button>
            </div>
        )}
    </div>
)
export default function Component() {
    

    const [expandedCategory, setExpandedCategory] = useState(null)
    const [syrupPumps, setSyrupPumps] = useState({})
    const [selectedMilk, setSelectedMilk] = useState(null)

    const toggleCategory = (categoryId) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
    }

    const adjustSyrupPumps = (syrupId, change) => {
        setSyrupPumps(prev => ({
            ...prev,
            [syrupId]: Math.max(0, (prev[syrupId] || 0) + change)
        }))
    }

    return (
        <div className="max-w-2xl mx-auto p-4 font-sans">
            <header className="bg-[#1e3932] text-white p-6 rounded-t-lg">
                <nav className="flex items-center text-sm mb-4">
                    <a href="#" className="hover:underline">Menu</a>
                    <ChevronLeft className="mx-2 h-4 w-4" />
                    <a href="#" className="hover:underline">Cold Coffees</a>
                    <ChevronLeft className="mx-2 h-4 w-4" />
                    <span>Butterbeer Frappuccino</span>
                </nav>
                <div className="flex items-center">
                    <img
                        src="https://image-link"
                        alt="Butterbeer Frappuccino"
                        className="w-32 h-32 object-cover rounded-full mr-6"
                    />
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Butterbeer Frappuccino</h1>
                        <p className="text-lg">Grande 16 fl oz</p>
                    </div>
                </div>
            </header>

            <main className="bg-white rounded-b-lg shadow-lg p-6">

                {categories.map((category) => (
                    <section key={category.id} className="mb-8">
                        <h2 className="text-xl font-bold mb-4">{category.name}</h2>
                        {category.id === 2 && (
                            <div className="space-y-4 mb-4">
                                {syrups.map(syrup => (
                                    <ListItem
                                        key={syrup.id}
                                        item={syrup}
                                        selected={syrupPumps[syrup.id] || 0}
                                        setSelected={change => adjustSyrupPumps(syrup.id, change)}
                                        type="syrup"
                                    />
                                ))}
                            </div>
                        )}
                        {category.id === 1 && (
                            <div className="space-y-2 mb-4">
                                {milks.map(milk => (
                                    <ListItem
                                        key={milk.id}
                                        item={milk}
                                        selected={selectedMilk}
                                        setSelected={setSelectedMilk}
                                        type="milk"
                                    />
                                ))}
                            </div>
                        )}
                        <div
                            className="bg-gray-100 rounded-lg p-4 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <span>{`Add ${category.name}`}</span>
                            <ChevronDown className={`h-6 w-6 text-[#00754a] transform transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`} />
                        </div>
                        {expandedCategory === category.id && (
                            <div className="mt-2 space-y-2">
                                {/* Render options dynamically */}
                                <div className="bg-white rounded-lg p-3 flex justify-between items-center shadow">
                                    <span>Option 1</span>
                                    <Check className="h-5 w-5 text-[#00754a]" />
                                </div>
                                <div className="bg-white rounded-lg p-3 flex justify-between items-center shadow">
                                    <span>Option 2</span>
                                    <Check className="h-5 w-5 text-[#00754a] opacity-0" />
                                </div>
                            </div>
                        )}
                    </section>
                ))}
            </main>
        </div>
    )
}
