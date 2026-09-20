/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - ENQUIRY MODULE (enquiry.js)
   Customer Event Quotation & Rental Enquiry Form with Firestore integration
   ========================================================================== */

import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  isFirebaseConfigured 
} from "./firebase-config.js";
import { escapeHtml, showToast } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  initEnquiryPage();
});

async function initEnquiryPage() {
  await loadAvailableOptions();
  checkUrlParams();
  handleFormSubmission();
}

// Load real services & items from Firestore into checkbox lists
async function loadAvailableOptions() {
  const servicesBox = document.getElementById("servicesCheckboxes");
  const itemsBox = document.getElementById("itemsCheckboxes");

  if (!isFirebaseConfigured() || !db) {
    if (servicesBox) {
      servicesBox.innerHTML = `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-muted);">
          <input type="checkbox" name="services" value="DJ Setup"> DJ Setup
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-muted);">
          <input type="checkbox" name="services" value="Sound System"> Sound System
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-muted);">
          <input type="checkbox" name="services" value="Event Lighting"> Event Lighting
        </label>
      `;
    }
    if (itemsBox) {
      itemsBox.innerHTML = `
        <p style="color: var(--text-dim); font-size: 0.85rem;">Rental items list will load once connected to database.</p>
      `;
    }
    return;
  }

  // Load Services
  if (servicesBox) {
    try {
      const snap = await getDocs(collection(db, "services"));
      if (snap.empty) {
        servicesBox.innerHTML = `<p style="color: var(--text-dim); font-size: 0.85rem;">No standard service packages listed. You can specify in the message.</p>`;
      } else {
        let html = "";
        snap.forEach(doc => {
          const s = doc.data();
          html += `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-main); cursor: pointer;">
              <input type="checkbox" name="services" value="${escapeHtml(s.name)}">
              <span>${escapeHtml(s.name)}</span>
            </label>
          `;
        });
        servicesBox.innerHTML = html;
      }
    } catch (err) {
      console.warn("Could not load services for enquiry:", err);
    }
  }

  // Load Items
  if (itemsBox) {
    try {
      const snap = await getDocs(collection(db, "items"));
      if (snap.empty) {
        itemsBox.innerHTML = `<p style="color: var(--text-dim); font-size: 0.85rem;">No rental items listed. You can mention needed items below.</p>`;
      } else {
        let html = "";
        snap.forEach(doc => {
          const it = doc.data();
          html += `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--text-main); cursor: pointer;">
              <input type="checkbox" name="items" value="${escapeHtml(it.name)}">
              <span>${escapeHtml(it.name)}</span>
            </label>
          `;
        });
        itemsBox.innerHTML = html;
      }
    } catch (err) {
      console.warn("Could not load items for enquiry:", err);
    }
  }
}

// Check URL params to pre-select item or service
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const targetItem = params.get("item");
  const targetService = params.get("service");

  if (targetItem) {
    setTimeout(() => {
      const itemInputs = document.querySelectorAll("input[name='items']");
      let matched = false;
      itemInputs.forEach(input => {
        if (input.value.toLowerCase() === targetItem.toLowerCase()) {
          input.checked = true;
          matched = true;
        }
      });
      if (!matched) {
        const msg = document.getElementById("enquiryMessage");
        if (msg) msg.value = `I am interested in renting: ${targetItem}\n` + (msg.value || "");
      }
    }, 400);
  }

  if (targetService) {
    setTimeout(() => {
      const srvInputs = document.querySelectorAll("input[name='services']");
      let matched = false;
      srvInputs.forEach(input => {
        if (input.value.toLowerCase() === targetService.toLowerCase()) {
          input.checked = true;
          matched = true;
        }
      });
      if (!matched) {
        const msg = document.getElementById("enquiryMessage");
        if (msg) msg.value = `I am interested in booking service: ${targetService}\n` + (msg.value || "");
      }
    }, 400);
  }
}

function handleFormSubmission() {
  const form = document.getElementById("eventEnquiryForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.customerName.value.trim();
    const phone = form.customerPhone.value.trim();
    const email = form.customerEmail.value.trim();
    const eventType = form.eventType.value;
    const eventDate = form.eventDate.value;
    const eventLocation = form.eventLocation.value.trim();
    const message = form.message.value.trim();

    if (!name || !phone || !eventType || !eventDate || !eventLocation) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    // Collect selected services
    const selectedServices = [];
    form.querySelectorAll("input[name='services']:checked").forEach(cb => {
      selectedServices.push(cb.value);
    });

    // Collect selected items
    const selectedItems = [];
    form.querySelectorAll("input[name='items']:checked").forEach(cb => {
      selectedItems.push(cb.value);
    });

    if (!isFirebaseConfigured() || !db) {
      showToast("Firebase not configured. Please connect Firebase to submit real enquiries.", "error");
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Your Enquiry...";

    try {
      await addDoc(collection(db, "enquiries"), {
        name,
        phone,
        email: email || "",
        eventType,
        eventDate,
        eventLocation,
        requiredServices: selectedServices,
        requiredItems: selectedItems,
        message: message || "",
        status: "Pending", // Default initial status
        createdAt: serverTimestamp()
      });

      form.reset();
      showToast("Enquiry submitted successfully! We will contact you shortly.", "success");

      const successBox = document.getElementById("enquirySuccessMessage");
      if (successBox) {
        successBox.style.display = "block";
        successBox.scrollIntoView({ behavior: "smooth" });
      }

    } catch (err) {
      console.error("Failed to submit enquiry:", err);
      showToast("Submission failed: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Event Enquiry";
    }
  });
}
