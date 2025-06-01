// js/programManagerPage.js
/**
 * Loads interview questions for the Program Manager role from a JSON file,
 * renders them into accordion sections, and sets up tab switching.
 */
async function loadProgramManagerContent() {
    // Get references to the main content sections
    const technicalSection = document.getElementById('section-technical');
    const behaviouralSection = document.getElementById('section-behavioural');
    const leadershipSection = document.getElementById('section-leadership');

    // Get references to the tab buttons
    const tabTechnical = document.getElementById('tab-technical');
    const tabBehavioural = document.getElementById('tab-behavioural');
    const tabLeadership = document.getElementById('tab-leadership');

    let allProgramManagerQuestions = {}; // Object to store all loaded questions by category

    try {
        // Fetch the JSON data containing all questions for Program Manager
        const response = await fetch('data/program-manager-questions.json');
        if (!response.ok) {
            // If the HTTP response is not OK (e.g., 404, 500), throw an error
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse the JSON response into a JavaScript object
        allProgramManagerQuestions = await response.json();

        // Initially render the Technical section, expanding its first question
        renderQuestionsForSection(technicalSection, allProgramManagerQuestions.technical, true);

        // Set up event listeners for tab switching
        tabTechnical.addEventListener('click', () => {
            switchTab('technical', technicalSection, allProgramManagerQuestions.technical);
        });
        tabBehavioural.addEventListener('click', () => {
            switchTab('behavioural', behaviouralSection, allProgramManagerQuestions.behavioural);
        });
        tabLeadership.addEventListener('click', () => {
            switchTab('leadership', leadershipSection, allProgramManagerQuestions.leadership);
        });

    } catch (error) {
        // Log any errors during fetching or parsing
        console.error('Failed to load Program Manager data:', error);
        // Display an error message to the user in the technical section
        technicalSection.innerHTML = '<p class="text-center text-red-500">Failed to load questions. Please try again later.</p>';
        // Optionally, you might want to disable tabs or hide other sections here
    }
}

/**
 * Renders a given array of questions into a specified container element.
 * Each question is rendered as an accordion item.
 *
 * @param {HTMLElement} containerElement - The DOM element where questions will be appended.
 * @param {Array<Object>} questionsArray - An array of question objects (each with 'question' and 'answer' properties).
 * @param {boolean} expandFirst - If true, the first question in the array will be expanded by default.
 */
function renderQuestionsForSection(containerElement, questionsArray, expandFirst = false) {
    // Clear any existing content (like "Loading questions...")
    containerElement.innerHTML = '';

    // Check if questionsArray is valid and not empty
    if (!questionsArray || questionsArray.length === 0) {
        containerElement.innerHTML = '<p class="text-center text-gray-500">No questions available for this category yet.</p>';
        return;
    }

    // Iterate over each question in the array
    questionsArray.forEach((q, index) => {
        // Determine if this is the first question and should be expanded
        const isFirstQuestion = (index === 0 && expandFirst);

        // Create the main accordion item container
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item'; // Apply Tailwind styles for border, rounded corners, etc.

        // Create the accordion header (the clickable question part)
        const header = document.createElement('button'); // Using <button> for better accessibility
        header.className = 'accordion-header w-full text-left'; // Apply Tailwind styles for padding, background, etc.
        header.setAttribute('aria-expanded', isFirstQuestion); // ARIA attribute for accessibility (screen readers)
        header.setAttribute('aria-controls', `answer-${q.id}`); // Links header to its content by ID

        // Create the span for the question text
        const questionText = document.createElement('span');
        questionText.textContent = q.question;

        // Create the span for the accordion icon (arrow)
        const icon = document.createElement('span');
        icon.className = 'accordion-icon'; // Apply Tailwind styles for transition, size
        icon.innerHTML = '&#9660;'; // Unicode for a down arrow

        // Create the accordion content (the answer part)
        const content = document.createElement('div');
        content.id = `answer-${q.id}`; // Unique ID for ARIA linking
        // Add 'hidden' class if not expanded, otherwise leave it visible
        content.className = `accordion-content ${isFirstQuestion ? '' : 'hidden'}`;
        content.setAttribute('aria-hidden', !isFirstQuestion); // ARIA attribute for accessibility

        // Convert '\n\n' in the answer string to HTML paragraph tags for proper formatting
        content.innerHTML = q.answer.split('\n\n').map(paragraph => `<p>${paragraph.trim()}</p>`).join('');

        // Append question text and icon to the header
        header.appendChild(questionText);
        header.appendChild(icon);
        // Append header and content to the accordion item
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);

        // Add click event listener to the header to toggle content visibility
        header.addEventListener('click', () => {
        const isCurrentlyExpanded = header.getAttribute('aria-expanded') === 'true';

        // *** NEW LOGIC START ***
        // Close all other open accordions in this section
        containerElement.querySelectorAll('.accordion-header[aria-expanded="true"]').forEach(otherHeader => {
        // Ensure we don't close the current header if it's already expanded
        if (otherHeader !== header) {
            otherHeader.setAttribute('aria-expanded', 'false');
            const otherContent = document.getElementById(otherHeader.getAttribute('aria-controls'));
            if (otherContent) {
                otherContent.classList.add('hidden');
                otherContent.setAttribute('aria-hidden', 'true');
            }
            const otherIcon = otherHeader.querySelector('.accordion-icon');
            if (otherIcon) {
                otherIcon.style.transform = 'rotate(0deg)';
            }
        }
    });
    // *** NEW LOGIC END ***

    // Toggle the clicked accordion's state (expand if it was closed, collapse if it was open)
        header.setAttribute('aria-expanded', !isCurrentlyExpanded);
        content.classList.toggle('hidden', isCurrentlyExpanded); // Use second arg to explicitly add/remove
        content.setAttribute('aria-hidden', isCurrentlyExpanded); // Use second arg to explicitly add/remove

    // Rotate the icon based on expansion state
        icon.style.transform = isCurrentlyExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
});

        // Add keyboard support for accessibility (Enter and Space keys)
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent default scroll behavior for spacebar
                header.click(); // Simulate a click
            }
        });

        // Append the complete accordion item to the container
        containerElement.appendChild(accordionItem);
    });
}

/**
 * Handles switching between different question categories (tabs).
 * Hides all sections, activates the selected tab button, and shows/renders
 * the content for the corresponding section.
 *
 * @param {string} tabName - The name of the tab (e.g., 'technical', 'behavioural').
 * @param {HTMLElement} sectionElement - The HTML element representing the section to show.
 * @param {Array<Object>} questionsData - The array of questions relevant to this section.
 */
function switchTab(tabName, sectionElement, questionsData) {
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active-tab'));
    // Hide all question sections
    document.querySelectorAll('.question-section').forEach(sec => sec.classList.add('hidden'));

    // Activate the clicked tab button
    document.getElementById(`tab-${tabName}`).classList.add('active-tab');
    // Show the corresponding question section
    sectionElement.classList.remove('hidden');

    // Render the questions for the newly active section.
    // We pass 'true' to expand the first question of the newly active tab.
    renderQuestionsForSection(sectionElement, questionsData, true);
}

// Ensure the DOM is fully loaded before attempting to load content
document.addEventListener('DOMContentLoaded', loadProgramManagerContent);
