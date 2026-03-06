(() => {
  /**
   * Download Gate (FORM SUBMIT MODE)
   * - Click download -> if flagged => open link in new tab
   * - else open modal -> user completes form + reCAPTCHA -> on submit:
   *     1) set flag
   *     2) open download link in new tab
   *     3) submit form normally to Salesforce (browser navigates)
   * - retURL = current page URL (no hash)
   */

  const CFG = {
    flagKey: "hazo_quote_submitted_v1",

    action:
      "https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D5g0000097hss",
    oid: "00D5g0000097hss",
    captcha_settings:
      '{"keyname":"HazoWorldV2","fallback":"true","orgId":"00D5g0000097hss","ts":""}',
    recordType: "0125g000000hxXuAAI",

    siteKey: "6LegZXksAAAAAE6W4WsHXtoMPtUJ9tmYpCfGlFwJ",
    modalId: "downloadGateModal",
  };

  const hasFlag = () => localStorage.getItem(CFG.flagKey) === "1";
  const setFlag = () => localStorage.setItem(CFG.flagKey, "1");

  // current page URL (no hash)
  const getRetURL = () =>
    window.location.origin + window.location.pathname + window.location.search;

  // -------- Modal HTML --------
  function buildModalOnce() {
    if (document.getElementById(CFG.modalId)) return;

    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = CFG.modalId;
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <p class="font-nunito-sans modal-title font-size-20 text-black font-weight-700">
              Please fill in your details to download
            </p>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <form class="margin-top-20 margin-btm-40"
                  data-dg-form
                  method="POST"
                  action="${escapeAttr(CFG.action)}">
              <input type="hidden" name="captcha_settings" value='${escapeHtml(
      CFG.captcha_settings
    )}' id="captcha_settings">
              <input type="hidden" name="oid" value="${escapeAttr(CFG.oid)}">
              <input type="hidden" name="retURL" value="${escapeAttr(
      encodeURI(getRetURL())
    )}" data-dg-returl>
              <input type="hidden" name="recordType" value="${escapeAttr(
      CFG.recordType
    )}">
              <input type="hidden" name="g-recaptcha-response" value="" data-dg-recaptcha-response>
              <input type="hidden" id="00NOc000004AUk5" name="00NOc000004AUk5" value="1">
              <div class="row">
                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="40" name="first_name" type="text" placeholder="* First Name" required>
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="80" name="last_name" type="text" placeholder="* Last Name" required>
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20"
                         maxlength="80" name="email" type="email" placeholder="* Email" required>
                </div>

                <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                  <input class="form-control margin-btm-20" id="Company"
                         maxlength="40" name="company" type="text" placeholder="* Company" required>
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
  }

  // -------- reCAPTCHA explicit render per modal --------
  let widgetId = null;
  function ensureRecaptchaRendered(modalEl) {
    const box = modalEl.querySelector("[data-dg-recaptcha]");
    const btn = modalEl.querySelector("[data-dg-submit]");
    const hint = modalEl.querySelector("[data-dg-hint]");
    const error = modalEl.querySelector("[data-dg-error]");

    // already rendered
    if (widgetId !== null) {
      try {
        window.grecaptcha && window.grecaptcha.reset(widgetId);
      } catch {}
      btn.disabled = true;
      hint.style.display = "none";
      error.style.display = "none";
      return;
    }

    const tryRender = () => {
      if (!window.grecaptcha || !window.grecaptcha.render) {
        btn.disabled = true;
        hint.style.display = "block";
        hint.textContent = "reCAPTCHA is loading… please wait a moment.";
        return false;
      }

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

    if (tryRender()) return;

    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (tryRender() || n > 30) clearInterval(t);
    }, 200);
  }

  // -------- Submit handler (FORM SUBMIT) --------
  function onModalSubmit(e) {
    // DO NOT preventDefault — we want normal form submit
    const form = e.currentTarget;
    const modalEl = form.closest(".modal");
    const btn = form.querySelector("[data-dg-submit]");
    const hint = form.querySelector("[data-dg-hint]");
    const error = form.querySelector("[data-dg-error]");
    const link = modalEl.getAttribute("data-dg-link") || "/";

    // update retURL to current page at submit time (in case URL changed)
    const retInput = form.querySelector("[data-dg-returl]");
    if (retInput) retInput.value = encodeURI(getRetURL());

    // recaptcha token
    let token = "";
    try {
      token = window.grecaptcha ? window.grecaptcha.getResponse(widgetId) : "";
    } catch {
      token = "";
    }

    if (!token) {
      e.preventDefault();
      hint.style.display = "block";
      hint.textContent = "Please complete the reCAPTCHA to submit.";
      btn.disabled = true;
      return;
    }

    // set token into hidden input
    const tokenInput = form.querySelector("[data-dg-recaptcha-response]");
    tokenInput.value = token;

    // 1) set flag before leaving page
    setFlag();

    // 2) open download link in NEW TAB (sync, less likely blocked)
    try {
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {}

    // 3) let the browser submit the form and redirect to retURL
    // Optionally hide modal immediately (not required)
    try {
      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.hide();
    } catch {}

    btn.disabled = true;
    error.style.display = "none";
  }

  // -------- Click interception --------
  function onClick(e) {
    const a = e.target.closest("[data-download-gate]");
    if (!a) return;

    const link = a.getAttribute("data-link") || a.getAttribute("href") || "";
    if (!link) return;

    // if already submitted -> open directly in new tab
    if (hasFlag()) {
      e.preventDefault();
      window.open(link, "_blank", "noopener,noreferrer");
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
      // if bootstrap missing -> fallback open link
      window.open(link, "_blank", "noopener,noreferrer");
    }
  }

  // -------- Existing SF forms hook (keep) --------
  function hookExistingSalesforceForms() {
    document.querySelectorAll("form[data-sf-webtolead]").forEach((form) => {
      form.addEventListener(
        "submit",
        () => {
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