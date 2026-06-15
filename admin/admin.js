(function () {
  var form = document.getElementById('configForm');
  var statusBox = document.getElementById('status');
  var tokenInput = document.getElementById('adminToken');
  var previewBox = document.getElementById('previewBox');
  var currentConfig = {};

  function setStatus(text, kind) {
    statusBox.textContent = text;
    statusBox.className = 'status ' + (kind || '');
  }

  function getPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key];
    }, obj);
  }

  function setPath(obj, path, value) {
    var parts = path.split('.');
    var cursor = obj;
    parts.slice(0, -1).forEach(function (key) {
      cursor[key] = cursor[key] || {};
      cursor = cursor[key];
    });
    cursor[parts[parts.length - 1]] = value;
  }

  function fillForm(config) {
    currentConfig = config || {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) return;
      var value = getPath(currentConfig, field.name);
      if (field.type === 'checkbox') {
        field.checked = value === true;
      } else if (value !== undefined && value !== null) {
        field.value = value;
      }
    });
    updatePreview();
  }

  function collectForm() {
    var config = JSON.parse(JSON.stringify(currentConfig || {}));
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) return;
      var value = field.type === 'checkbox' ? field.checked : field.value;
      if (field.type === 'number') {
        value = Number(value || 0);
      }
      setPath(config, field.name, value);
    });
    return config;
  }

  function updatePreview() {
    var config = collectForm();
    var brand = config.branding || {};
    var announcement = config.announcement || {};
    previewBox.innerHTML = [
      '<strong>' + (brand.siteName || 'Nome da loja') + '</strong>',
      '<span>' + (brand.titleSuffix || 'Floricultura') + '</span>',
      announcement.enabled && announcement.text
        ? '<div class="preview-announcement" style="margin-top:10px;padding:8px;border-radius:6px;background:' + (brand.primaryColor || '#88a800') + ';color:#fff">' + announcement.text + '</div>'
        : '<div style="margin-top:10px">Aviso promocional desativado.</div>'
    ].join('<br>');
  }

  function downloadConfig(config) {
    var blob = new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'site-config.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function loadConfig() {
    setStatus('Carregando...', '');
    var response = await fetch('/api/admin-config', { cache: 'no-store' }).catch(function () {
      return null;
    });
    if (!response || !response.ok) {
      response = await fetch('/site-config.json', { cache: 'no-store' });
    }
    if (!response.ok) throw new Error('Não foi possível carregar.');
    fillForm(await response.json());
    setStatus('Configuração carregada', 'ok');
  }

  async function saveConfig() {
    var config = collectForm();
    setStatus('Salvando...', '');
    var response = await fetch('/api/admin-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokenInput.value.trim()
      },
      body: JSON.stringify(config)
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Não foi possível salvar online.');
    }
    currentConfig = data.config || config;
    setStatus('Salvo com sucesso', 'ok');
  }

  tokenInput.value = localStorage.getItem('bethyAdminToken') || '';
  tokenInput.addEventListener('input', function () {
    localStorage.setItem('bethyAdminToken', tokenInput.value);
  });

  form.addEventListener('input', updatePreview);
  document.getElementById('reloadBtn').addEventListener('click', function () {
    loadConfig().catch(function (error) { setStatus(error.message, 'error'); });
  });
  document.getElementById('saveBtn').addEventListener('click', function () {
    saveConfig().catch(function (error) { setStatus(error.message, 'error'); });
  });
  document.getElementById('exportBtn').addEventListener('click', function () {
    downloadConfig(collectForm());
  });

  document.getElementById('logoFile').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 700 * 1024) {
      setStatus('Use uma logo menor que 700 KB.', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      form.elements['branding.logoUrl'].value = reader.result;
      updatePreview();
    };
    reader.readAsDataURL(file);
  });

  loadConfig().catch(function (error) {
    setStatus(error.message, 'error');
  });
})();
