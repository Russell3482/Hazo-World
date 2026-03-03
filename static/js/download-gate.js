(() => {
  /**
   * Download Gate
   * - Click download -> if flagged => go link
   * - else open modal -> submit (Salesforce WebToLead) with reCAPTCHA -> set flag -> go link
   * - No global IDs, no global callbacks, safe with multiple forms on same page
   */

  const CFG = {
    flagKey: "hazo_quote_submitted_v1",

    // Salesforce endpoint + fixed hidden fields (from your form)
    action:
      "https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D5g0000097hss",
    oid: "00D5g0000097hss",
    retURL: "http://hazoworld.com",
    captcha_settings:
      '{"keyname":"hazoworld","fallback":"true","orgId":"00D5g0000097hss","ts":""}',
    recordType: "0125g000000hxXu",

    // reCAPTCHA site key
    siteKey: "6LegZXksAAAAAE6W4WsHXtoMPtUJ9tmYpCfGlFwJ",

    // Bootstrap Modal id (single shared modal)
    modalId: "downloadGateModal",
  };

  const hasFlag = () => localStorage.getItem(CFG.flagKey) === "1";
  const setFlag = () => localStorage.setItem(CFG.flagKey, "1");

  // ---------- Modal HTML (no conflicting IDs) ----------
  function buildModalOnce() {
    if (document.getElementById(CFG.modalId)) return;

    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = CFG.modalId;
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen">
        <div class="modal-content">
          <div class="modal-header">
            <p class="font-nunito-sans modal-title font-size-20 text-black font-weight-700">
              Please fill in your details to download
            </p>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <form class="margin-top-20 margin-btm-40" data-dg-form>
              <input type="hidden" name="captcha_settings" value='${escapeHtml(
      CFG.captcha_settings
    )}'>
              <input type="hidden" name="oid" value="${escapeAttr(CFG.oid)}">
              <input type="hidden" name="retURL" value="${escapeAttr(CFG.retURL)}">
              <input type="hidden" name="recordType" value="${escapeAttr(
      CFG.recordType
    )}">
              <input type="hidden" name="g-recaptcha-response" value="" data-dg-recaptcha-response>

              <div class="row">
                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="40" name="first_name" type="text" placeholder="First Name">
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="80" name="last_name" type="text" placeholder="Last Name">
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="80" name="email" type="email" placeholder="* Email" required>
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="40" name="company" type="text" placeholder="Company">
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="40" name="phone" type="tel" placeholder="* Phone" required>
                </div>
              </div>

              <textarea class="form-control height-150 margin-btm-30"
                        name="description" placeholder="* Message" required></textarea>

              <div class="margin-btm-20">
                <div data-dg-recaptcha></div>
              </div>

              <div class="text-center">
                <button type="submit" class="btn btn-primary btn-radius" disabled data-dg-submit>
                  Download Now
                </button>
                <p class="margin-top-10" style="display:none; opacity:.8;" data-dg-hint>
                  Please complete the reCAPTCHA to submit.
                </p>
              </div>

              <p style="display:none; opacity:.8;" data-dg-error class="margin-top-10 text-danger"></p>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // wire submit (scoped!)
    const form = modal.querySelector("[data-dg-form]");
    form.addEventListener("submit", onModalSubmit);

    // ensure we have a bootstrap.Modal instance
    // (bootstrap is expected in your site)
  }

  // ---------- reCAPTCHA explicit render per modal ----------
  let widgetId = null;
  function ensureRecaptchaRendered(modalEl) {
    const box = modalEl.querySelector("[data-dg-recaptcha]");
    const btn = modalEl.querySelector("[data-dg-submit]");
    const hint = modalEl.querySelector("[data-dg-hint]");
    const error = modalEl.querySelector("[data-dg-error]");

    // already rendered
    if (widgetId !== null) {
      // reset token for safety
      try {
        window.grecaptcha && window.grecaptcha.reset(widgetId);
      } catch {}
      btn.disabled = true;
      hint.style.display = "none";
      error.style.display = "none";
      return;
    }

    // wait for grecaptcha
    const tryRender = () => {
      if (!window.grecaptcha || !window.grecaptcha.render) {
        // recaptcha script not ready yet
        btn.disabled = true;
        hint.style.display = "block";
        hint.textContent = "reCAPTCHA is loading… please wait a moment.";
        return false;
      }

      // render with function callbacks (NO global callback names)
      widgetId = window.grecaptcha.render(box, {
        sitekey: CFG.siteKey,
        callback: () => {
          btn.disabled = false;
          hint.style.display = "none";
        },
        "expired-callback": () => {
          btn.disabled = true;
          hint.style.display = "block";
          hint.textContent = "reCAPTCHA expired. Please verify again.";
        },
        "error-callback": () => {
          btn.disabled = true;
          hint.style.display = "block";
          hint.textContent = "reCAPTCHA error. Please try again.";
        },
      });

      btn.disabled = true;
      hint.style.display = "none";
      error.style.display = "none";
      return true;
    };

    // try now, if fail -> poll a bit
    if (tryRender()) return;

    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (tryRender() || n > 30) clearInterval(t); // ~6s max
    }, 200);
  }

  // ---------- Submit: post to Salesforce, set flag, go link ----------
  async function onModalSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const modalEl = form.closest(".modal");
    const btn = form.querySelector("[data-dg-submit]");
    const hint = form.querySelector("[data-dg-hint]");
    const error = form.querySelector("[data-dg-error]");
    const link = modalEl.getAttribute("data-dg-link") || "/";

    // recaptcha token
    let token = "";
    try {
      token = window.grecaptcha ? window.grecaptcha.getResponse(widgetId) : "";
    } catch {
      token = "";
    }

    if (!token) {
      hint.style.display = "block";
      hint.textContent = "Please complete the reCAPTCHA to submit.";
      btn.disabled = true;
      return;
    }

    // put token into hidden input (avoid relying on auto textarea)
    const tokenInput = form.querySelector("[data-dg-recaptcha-response]");
    tokenInput.value = token;

    // build payload
    const fd = new FormData(form);

    // Submit to Salesforce (no-cors, keep user on page)
    btn.disabled = true;
    error.style.display = "none";
    try {
      await fetch(CFG.action, {
        method: "POST",
        mode: "no-cors",
        body: fd,
      });

      // mark as submitted globally
      setFlag();

      // close modal then download
      try {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.hide();
      } catch {}

      window.location.href = link;
    } catch (err) {
      error.style.display = "block";
      error.textContent =
        "Submit failed (network). Please try again, or use the contact form.";
      btn.disabled = false;
    }
  }

  // ---------- Click interception for all download buttons ----------
  function onClick(e) {
    const a = e.target.closest("[data-download-gate]");
    if (!a) return;

    const link = a.getAttribute("data-link") || a.getAttribute("href") || "";
    if (!link) return;

    if (hasFlag()) {
      // allow default navigation
      return;
    }

    e.preventDefault();
    buildModalOnce();
    const modalEl = document.getElementById(CFG.modalId);
    modalEl.setAttribute("data-dg-link", link);

    ensureRecaptchaRendered(modalEl);

    try {
      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    } catch {
      // bootstrap not present -> fallback
      window.location.href = link;
    }
  }

  // ---------- Make the OLD Salesforce form also set the same flag ----------
  // You can add data attribute to those forms: data-sf-webtolead
  // Then we listen submit and set flag when captcha is present.
  function hookExistingSalesforceForms() {
    document.querySelectorAll("form[data-sf-webtolead]").forEach((form) => {
      form.addEventListener(
        "submit",
        () => {
          // If user submits any old form successfully, we still set flag.
          // (Even if SF redirects, flag is already stored.)
          setFlag();
        },
        { capture: true }
      );
    });
  }

  // helpers
  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // init
  window.addEventListener("click", onClick);
  window.addEventListener("DOMContentLoaded", hookExistingSalesforceForms);
})();