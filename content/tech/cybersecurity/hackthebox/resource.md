---
title: "Resource"
type: docs
prev: docs/cybersecurity/hackthebox
---

---
---
<script>
document.addEventListener('DOMContentLoaded', function() {
    var password = prompt("Enter the password to view the content:");
    if (password !== "1#ViewTheWalkthrough#1") {
        document.body.innerHTML = `
            <p>Here are a few hints:</p>
            <ul>
                <li>Shell Hint: PHP Deserialization + ZIP Files with data </li>
                <li>User Hint: SSH Signing </li>
                <li>Root Hint: SSH Globbing Leak </li>
            </ul>
            <p>Note: The box is still active. This information will be released publicly when it is no longer active.</p>
            <button onclick="window.location.href='/tech/cybersecurity'">Back to Cybersecurity</button>
        `;
        document.querySelector("button").style.cssText = "margin-top: 20px; padding: 10px 20px; font-size: 16px; border: 2px solid #808080; color: #808080; border-radius: 5px; cursor: pointer; background-color: transparent;";
    } else {
        document.getElementById("prePromptMessage").style.display = "block";
    }
});
</script>

