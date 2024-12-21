// The correct password to reveal the content
const correctPassword = "TheseBoxesAreActive"; // Replace with your actual password

function checkPassword() {
    // Get the password input element
    const passwordInput = document.getElementById('passwordInput');
    // Get the entered password value
    const enteredPassword = passwordInput.value;

    // Check if the entered password is correct
    if (enteredPassword === correctPassword) {
        // Hide the password prompt
        document.getElementById('passwordPrompt').style.display = 'none';
        // Show the protected content
        document.getElementById('protectedContent').style.display = 'block';
        // Optionally show additional hints or messages
        document.getElementById('prePromptMessage').style.display = 'block';
    } else {
        // Show an error message if the password is incorrect
        document.getElementById('errorMessage').style.display = 'block';
    }
}
