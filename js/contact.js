/* ==========================================================================
   SKY DJ & EVENT MANAGEMENT - CONTACT MODULE (contact.js)
   Dynamic contact methods (WhatsApp, Call, Email, Maps) & direct message form
   ========================================================================== */

import { 
  db, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  isFirebaseConfigured 
} from "./firebase-config.js";
import { escapeHtml, showToast } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  loadContactDetails();
  initContactForm();
});

async function loadContactDetails() {
  const phoneBox = document.getElementById("contactPhoneBox");
  const whatsappBox = document.getElementById("contactWhatsappBox");
  const emailBox = document.getElementById("contactEmailBox");
  const addressBox = document.getElementById("contactAddressBox");
  const mapsContainer = document.getElementById("googleMapsContainer");
  const hoursBox = document.getElementById("contactHoursBox");

  if (!isFirebaseConfigured() || !db) return;

  try {
    const docRef = doc(db, "businessSettings", "main");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();

      // Phone
      if (phoneBox && data.phone) {
        phoneBox.style.display = "flex";
        const clean = data.phone.replace(/[^0-9+]/g, "");
        phoneBox.querySelector(".contact-value").innerHTML = `<a href="tel:${clean}">${escapeHtml(data.phone)}</a>`;
      }

      // WhatsApp
      if (whatsappBox && data.whatsapp) {
        whatsappBox.style.display = "flex";
        const cleanWa = data.whatsapp.replace(/[^0-9]/g, "");
        const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent("Hello SKY DJ & EVENT MANAGEMENT, I would like to enquire about your services.")}`;
        whatsappBox.querySelector(".contact-value").innerHTML = `<a href="${waUrl}" target="_blank" rel="noopener" class="text-gold">Chat on WhatsApp (${escapeHtml(data.whatsapp)}) →</a>`;
      }

      // Email
      if (emailBox && data.email) {
        emailBox.style.display = "flex";
        emailBox.querySelector(".contact-value").innerHTML = `<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`;
      }

      // Address
      if (addressBox && data.address) {
        addressBox.style.display = "flex";
        addressBox.querySelector(".contact-value").textContent = data.address;
      }

      // Hours
      if (hoursBox && data.openingHours) {
        hoursBox.style.display = "flex";
        hoursBox.querySelector(".contact-value").textContent = data.openingHours;
      }

      // Google Maps
      if (mapsContainer && data.googleMapsUrl) {
        mapsContainer.style.display = "block";
        mapsContainer.innerHTML = `
          <iframe 
            src="${escapeHtml(data.googleMapsUrl)}" 
            width="100%" 
            height="360" 
            style="border:0; border-radius: var(--radius-lg);" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        `;
      }
    }
  } catch (err) {
    console.warn("Could not load contact settings:", err);
  }
}

function initContactForm() {
  const form = document.getElementById("directContactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.senderName.value.trim();
    const phone = form.senderPhone.value.trim();
    const email = form.senderEmail.value.trim();
    const message = form.senderMessage.value.trim();
    const submitBtn = form.querySelector("button[type='submit']");

    if (!name || !phone || !message) {
      showToast("Please enter your name, phone number, and message.", "error");
      return;
    }

    if (!isFirebaseConfigured() || !db) {
      showToast("Firebase is not connected yet. Please contact us via phone or WhatsApp.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending Message...";

    try {
      await addDoc(collection(db, "enquiries"), {
        name,
        phone,
        email: email || "",
        eventType: "General Contact / Inquiry",
        eventDate: "N/A",
        eventLocation: "N/A",
        requiredServices: [],
        requiredItems: [],
        message,
        status: "Pending",
        createdAt: serverTimestamp()
      });

      form.reset();
      showToast("Message sent successfully! We will get back to you shortly.", "success");

      const successBox = document.getElementById("contactSuccessMessage");
      if (successBox) {
        successBox.style.display = "block";
      }

    } catch (err) {
      console.error("Failed to send message:", err);
      showToast("Failed to send message: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}
