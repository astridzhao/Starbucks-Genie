#!/usr/bin/env python
# src/starbucks_genie/main.py
from starbucks_genie.src.starbucks_genie.old.crew_old import DrinkInnovationCrew
import json 

def run(user_preference, user_input):
    """
    Run the drink Crew
    """
    # data = request.get_json()
    inputs = {
        'user-preference':user_preference,
        'user-input':user_input,
    }
    result = DrinkInnovationCrew().crew().kickoff(inputs=inputs)
    
    print("######################")
    print(result)
    
    print("######################")
    data = result.json_dict
    # Accessing data
    name = data['name']
    ingredients = data['ingredient']
    # nutrition = data['nutrition']
    recommendation = data['recommendation']

    response = {
        'name': name,
        'ingredients': ingredients,
        # 'nutrition': nutrition,
        'recommendation': recommendation
    }
    
    return response
    
    
    # Example of outputting the information
    # print(f"Drink Name: {name}")
    # print("Ingredients:")
    # for ingredient in ingredients:
    #     print(f" - {ingredient}")
    # print("Nutritional Information:")
    # for info in nutrition:
    #     print(f" - {info}")
    # print(f"Recommendation: {recommendation}")