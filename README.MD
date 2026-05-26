Project Description
The Meeting Transcript Summarizer is a web application that helps teams organize long, messy meeting conversations. When a user pastes a raw chat script or transcript into the app, an AI reads through the text to instantly create a short summary paragraph, bulleted action items, and relevant category tags. The app also includes a smart search bar that lets users find past meetings based on the concepts discussed, rather than just matching exact words.

Technologies Used
Frontend: React (for building the user interface and web screens) and Axios (for sending data from the web page to the server).

Backend: Node.js and Express (for running the server and managing requests).

Database: MariaDB (for securely saving users and meeting details).

AI Engine: Google Gemini API (used for reading the transcripts, generating text summaries, and powering the smart search feature).

Setup Instructions
Database: Open your MariaDB database and create a table for users and a table for transcripts. Ensure the transcripts table is linked to the users table so everyone's data stays separate.

Backend: Create a hidden .env configuration file inside your backend folder and type in your database connection details along with your Google Gemini API key. Run npm install and then node server.js to start the server.

Frontend: Open your frontend folder in a terminal, run npm install to get the necessary web packages, and run npm run dev to launch the website in your browser.

User Actions & Features
Register & Login: Users can create an account and log in. Once logged in, they can only see, search, or modify their own private transcripts.

Submit Transcript (Create & Read): Paste a meeting text block and hit submit. The AI instantly generates a neat overview with bullet points, which is displayed on the screen and saved to the database.

Rename Meeting (Update): Users can click a rename button on any saved meeting card to update its title instantly.

Remove Meeting (Delete): Users can click a red delete button to permanently erase a transcript from both the screen and the database.

AI & Smart Search Explained
AI Generation: The app uses the Gemini model to read unstructured text dialogues and reorganize them into structured summaries, tasks, and tags automatically.

Smart Search (Semantic Retrieval): When you type a phrase into the search bar, the app converts the underlying meaning of your query into mathematical numbers. It compares those numbers against your saved meetings to find conceptual matches.

The Smart Search Filter: To keep search results highly accurate, the system drops unrelated topics (like searching for food terms in a software project) down to a 0.0% match score instead of showing random false matches.

Error Handling Scenario
Empty Form Validation: If a user clicks the submit button without entering a title or text, the application stops the request immediately and triggers a pop-up alert warning the user. This protects the server and prevents wasting AI network resources on empty inputs.

API Rate Limiting: If too many AI requests are fired within a single minute, the application detects the server slowdown and alerts the user to wait 10 seconds before trying again, preventing the app from crashing.

Limitations & Future Improvements
Current Limit: The smart search calculation is handled by the server's local memory, which works great for a few files but will slow down as the database grows. Passwords are also currently stored in plain text for demonstration simplicity.

Future Upgrades: In the future, the app can be upgraded to use a dedicated database extension to handle thousands of vectors instantly, add heavy password encryption for real-world safety, and let users chat directly with all their past meetings in a continuous Q&A thread.