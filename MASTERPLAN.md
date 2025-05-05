# Refri Master

## App Overview & Objectives
This app allows users to manage their kitchen inventory, create, find, and share macro-friendly recipes, and interact with others in a social media-like environment. The primary goal is to help users stay on track with their nutrition goals by providing personalized recipe suggestions and allowing them to engage with like-minded individuals.

## Target Audience
* Health-conscious individuals, fitness enthusiasts, and people with specific dietary goals (e.g., low-carb, high-protein, etc.)
* Users looking to discover, share, and store macro-friendly recipes.
* People who want to track their kitchen inventory and reduce food waste.

## Core Features & Functionality
1. **User Profiles:**
    * Users can create profiles, follow others, and be followed.
    * Ability to set macro goals manually during onboarding and update them later.
    * Privacy settings to block users or make profiles private.

2. **Recipe Creation & Sharing:**
    * Users take photos of their creations, select ingredients with measurements, and enter preparation steps.
    * Macros are calculated automatically based on the selected ingredients.
    * Tags can be added manually, with auto-generated tags based on ingredients and macros.

3. **Feed:**
    * A personalized feed that displays recipes from users they follow and suggestions based on macro goals.
    * Users can like (save) recipes and comment on posts to discuss substitutions or opinions.

4. **Kitchen Inventory Management:**
    * Users manually add/remove items from their inventory.


5. **Notifications:**
    * Push notifications for likes, comments, and follows.

6. **External Sharing:**
    * Users can share recipes to external platforms (e.g., social media).

## High-level Technical Stack Recommendations
* **Frontend (Mobile):** React Native (for cross-platform development)
* **Backend:** Nodejs & Express backend server
* **External APIs:** FatSecret API (for nutritional data and ingredient search)


## Conceptual Data Model
* **Users:** ID, profile information, macro goals, followed users, saved recipes
* **Recipes:** ID, user ID (creator), ingredients (list with measurements), preparation steps, macros (calculated), tags
* **Ingredients:** ID, name, nutritional data, expiration date
* **Comments:** ID, user ID, recipe ID, content, timestamp
* **Likes:** ID, user ID, recipe ID, timestamp

## User Interface Design Principles
* **Simplicity and Intuition:** Keep the design clean and straightforward to encourage engagement.
* **Customization:** Allow users to personalize their profiles and settings.
* **Easy Recipe Creation:** Simple forms for users to input ingredients and steps, with the option to auto-calculate macros.
* **Feed and Discovery:** Clear navigation between the personalized feed, recipe search, and kitchen inventory.


## Development Phases or Milestones
1. **Phase 1 - MVP:**
    * User authentication and profile creation.
    * Recipe creation and sharing (photo, ingredients, steps).
    * Kitchen inventory management (manual addition, expiration date).
    * Personalized feed with recipe suggestions based on macro goals.
    * Basic push notifications (likes, comments, follows).

2. **Phase 2 - Social Features:**
    * Follow/unfollow users.
    * Commenting and liking posts.
    * Improved recipe search and ingredient discovery using the FatSecret API.

3. **Phase 3 - Expansions:**
    * Barcode and receipt scanning for ingredient addition.
    * Premium features (advanced macro tracking, exclusive recipe collections).
    * In-app purchase options for subscriptions.


## Future Expansion Possibilities
* **Premium Features:** Offer in-app purchases or subscriptions for exclusive recipes, meal plans, or advanced tracking tools.
* **Barcode Scanning:** Allow users to scan barcodes for quick ingredient addition.
* **AI Integration:** Use machine learning to recommend personalized recipes based on dietary preferences and past activity.
* **Community Building:** Expand social features, such as recipe challenges or group meal planning.
