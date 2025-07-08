- Use consistent naming conventions for variables, functions, and classes.
- Follow the DRY (Don't Repeat Yourself) principle to avoid code duplication.
- Write modular and reusable code to enhance maintainability.
- Use comments and documentation to explain complex logic or important decisions.
- Ensure code is well-structured and follows best practices for readability.

## Domain Knowledge & Project Preferences

- This project manages products, Facebook posts, and images for a retail/discount platform aggregator.
- Data comes from Facebook, RapidAPI, and Cloudinary.
- The frontend is React (with hooks), the backend is Node.js/Express.
- Facebook pages for many different stores are scraped via RapidAPI, returning JSON data with post text and image URIs (sometimes multiple images, sometimes just one).
- The returned image URIs are uploaded to a Cloudinary account so they can be referenced and sent to Gemini LLM for further processing.
- After the images are uploaded to Cloudinary, they are sent to a Gemini API so all flyer sale details can be extracted and returned in JSON format.
- The Gemini API extracts all the product information, such as product description, old price, and sale price.
- After all the sale information for each product is extracted, the data is loaded into a database schema in MySQL.
- Always deduplicate images by `imageId` or `uri` before sending to the backend or database.
- When building payloads for API calls, ensure all required fields are present and unique.
- When filtering posts or images, convert IDs to a consistent type (usually string) for comparison.
- Provide clear status messages to users for all async actions (fetch, upload, extract, etc.).
- Always use and display dates in a consistent, user-friendly format (preferably `YYYY-MM-DD`).
- Keep React components focused and avoid excessive logic in render sections.
- Use utility functions for deduplication, filtering, and payload construction.
- Log all major steps and data transformations.
- Use `try/catch` for all async/await API calls.
- Validate all user input before sending to the backend.
- Use `.map()` and `.filter()` for array transformations, and prefer `Set` or `Map` for deduplication.