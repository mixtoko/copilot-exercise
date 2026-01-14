document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Limpiar opciones previas del select (excepto la primera)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participantes con ícono de eliminar
        let participantsHtml = "";
        if (details.participants.length > 0) {
          participantsHtml = `<ul class=\"participants-list\">` +
            details.participants.map(participant =>
              `<li style=\"display: flex; align-items: center; gap: 0.5em;\">${participant}
                <span class=\"delete-participant\" title=\"Remove\" data-activity=\"${encodeURIComponent(name)}\" data-email=\"${encodeURIComponent(participant)}\" style=\"cursor:pointer;color:#c00;font-size:1.1em;\">&#128465;</span>
              </li>`
            ).join("") + `</ul>`;
        } else {
          participantsHtml = `<span class=\"info\">No participants yet.</span>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Agregar listeners a los íconos de eliminar
      document.querySelectorAll('.delete-participant').forEach(icon => {
        icon.addEventListener('click', async (e) => {
          const activity = decodeURIComponent(icon.getAttribute('data-activity'));
          const email = decodeURIComponent(icon.getAttribute('data-email'));
          if (!confirm(`¿Eliminar a ${email} de ${activity}?`)) return;
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
              fetchActivities();
            } else {
              alert(result.detail || 'Error al eliminar participante');
            }
          } catch (err) {
            alert('Error de red al eliminar participante');
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Actualizar la lista de actividades inmediatamente
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
