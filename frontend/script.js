document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('questionForm');
  const transcriptions = document.getElementById('transcriptions');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const questionInput = document.getElementById('question');
    const question = questionInput.value;

    // Display the user's question
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'outgoing');
    userMessage.innerHTML = `<p>${question}</p>`;
    transcriptions.appendChild(userMessage);

    // Fetch the response from the server
    const response = await fetch(`/pdf-loader/retrieve-data?query=${encodeURIComponent(question)}`);
    const data = await response.json();

    // Display the AI's response
    const aiMessage = document.createElement('div');
    aiMessage.classList.add('message', 'incoming');
    aiMessage.innerHTML = `<p>${data.answer.text}</p>`;
    transcriptions.appendChild(aiMessage);

    // Clear the input field
    questionInput.value = '';
  });
});
