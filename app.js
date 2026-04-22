const sectionMap = {
  demdet: document.getElementById('section_demdet'),
  demurrage: document.getElementById('section_demurrage'),
  detention: document.getElementById('section_detention'),
  storage: document.getElementById('section_storage'),
};

const formConfig = {
  demdet: {
    start: 'demdet_start',
    end: 'demdet_end',
    port: 'demdet_port',
    type: 'demdet_type',
    result: 'result_demdet',
    label: 'Demurrage + Detention',
  },
  demurrage: {
    start: 'demurrage_start',
    end: 'demurrage_end',
    port: 'demurrage_port',
    type: 'demurrage_type',
    result: 'result_demurrage',
    label: 'Demurrage',
  },
  detention: {
    start: 'detention_start',
    end: 'detention_end',
    port: 'detention_port',
    type: 'detention_type',
    result: 'result_detention',
    label: 'Detention',
  },
  storage: {
    start: 'storage_start',
    end: 'storage_end',
    port: 'storage_port',
    type: 'storage_type',
    result: 'result_storage',
    label: 'Storage',
  },
};

const infoBox = document.getElementById('info');
const carrierSelect = document.getElementById('carrierSelect');

let tariffRows = [];
let carriers = [];

init();

async function init() {
  try {
    tariffRows = await loadTariffs('rates.csv');
    carriers = getSortedCarriers(tariffRows);
    populateCarrierSelect(carriers);
    wireEvents();
    infoBox.textContent = 'Wybierz armatora z listy powyżej.';
  } catch (error) {
    console.error(error);
    infoBox.innerHTML = '<span class="error">Nie udało się wczytać pliku rates.csv. Sprawdź, czy plik znajduje się obok index.html i czy strona działa przez GitHub Pages lub lokalny serwer.</span>';
  }
}

function wireEvents() {
  carrierSelect.addEventListener('change', handleCarrierChange);

  Object.entries(formConfig).forEach(([chargeType, config]) => {
    document.querySelector(`[data-calc="${chargeType}"]`).addEventListener('click', () => calculateCharge(chargeType));

    [config.start, config.end, config.port, config.type].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => clearResult(config.result));
    });
  });
}

async function loadTariffs(filePath) {
  const response = await fetch(filePath, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Błąd odczytu pliku ${filePath}: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);

  return rows.map((row) => ({
    carrier: row.carrier?.trim(),
    chargeType: row.chargeType?.trim(),
    port: row.port?.trim(),
    containerType: row.containerType?.trim(),
    freeDays: toNumber(row.freeDays),
    dayFrom: toNumber(row.dayFrom),
    dayTo: row.dayTo?.trim() === 'Infinity' ? Number.POSITIVE_INFINITY : toNumber(row.dayTo),
    rate: toNumber(row.rate),
    currency: (row.currency || 'EUR').trim(),
    notes: (row.notes || '').trim(),
  })).filter((row) => row.carrier && row.chargeType && row.port && row.containerType);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function toNumber(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function getSortedCarriers(rows) {
  return [...new Set(rows.map((row) => row.carrier))].sort((a, b) => a.localeCompare(b, 'pl'));
}

function populateCarrierSelect(carrierList) {
  carrierList.forEach((carrier) => {
    const option = document.createElement('option');
    option.value = carrier;
    option.textContent = carrier;
    carrierSelect.appendChild(option);
  });
}

function handleCarrierChange() {
  hideAllSections();
  resetAllForms();

  const carrier = carrierSelect.value;
  if (!carrier) {
    infoBox.textContent = 'Wybierz armatora z listy powyżej.';
    return;
  }

  const availableChargeTypes = getCarrierChargeTypes(carrier);
  availableChargeTypes.forEach((chargeType) => {
    sectionMap[chargeType]?.classList.add('section--visible');
  });

  infoBox.textContent = buildInfoText(availableChargeTypes);
}

function getCarrierChargeTypes(carrier) {
  return [...new Set(tariffRows.filter((row) => row.carrier === carrier).map((row) => row.chargeType))];
}

function buildInfoText(chargeTypes) {
  const hasDemDet = chargeTypes.includes('demdet');
  const hasStorage = chargeTypes.includes('storage');
  const hasDemurrage = chargeTypes.includes('demurrage');
  const hasDetention = chargeTypes.includes('detention');

  if (hasDemDet && hasStorage) {
    return 'Ten armator stosuje łączone wyliczenia demurrage + detention oraz osobne storage.';
  }

  if (hasDemDet) {
    return 'Ten armator stosuje łączone wyliczenia demurrage + detention.';
  }

  if (hasDemurrage && hasDetention) {
    return 'Ten armator stosuje osobne wyliczenia demurrage oraz detention.';
  }

  return 'Dla wybranego armatora są dostępne tylko wybrane typy opłat.';
}

function hideAllSections() {
  Object.values(sectionMap).forEach((section) => section.classList.remove('section--visible'));
}

function resetAllForms() {
  Object.values(formConfig).forEach((config) => {
    document.getElementById(config.start).value = '';
    document.getElementById(config.end).value = '';
    document.getElementById(config.port).value = 'Gdansk';
    document.getElementById(config.type).value = '20DRY';
    clearResult(config.result);
  });
}

function clearResult(resultId) {
  document.getElementById(resultId).innerHTML = '';
}

function calculateCharge(chargeType) {
  const carrier = carrierSelect.value;
  const config = formConfig[chargeType];
  const resultBox = document.getElementById(config.result);
  resultBox.innerHTML = '';

  if (!carrier) {
    showError(resultBox, 'Najpierw wybierz armatora.');
    return;
  }

  const start = new Date(document.getElementById(config.start).value);
  const end = new Date(document.getElementById(config.end).value);
  const port = document.getElementById(config.port).value;
  const containerType = document.getElementById(config.type).value;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    showError(resultBox, 'Wprowadź poprawne daty.');
    return;
  }

  const matchingRows = tariffRows
    .filter((row) => row.carrier === carrier)
    .filter((row) => row.chargeType === chargeType)
    .filter((row) => row.port === port)
    .filter((row) => row.containerType === containerType)
    .sort((a, b) => a.dayFrom - b.dayFrom);

  if (!matchingRows.length) {
    showError(resultBox, 'Brak danych dla wybranego armatora, portu lub typu kontenera.');
    return;
  }

  const freeDays = matchingRows[0].freeDays ?? 0;
  const totalDays = daysInclusive(start, end);
  const exceededDays = Math.max(0, totalDays - freeDays);

  let totalCost = 0;
  let rowsHtml = '';

  matchingRows.forEach((row) => {
    const startDay = Math.max(row.dayFrom, freeDays + 1);
    const endDay = Math.min(row.dayTo, freeDays + exceededDays);
    const daysInRange = Math.max(0, endDay - startDay + 1);

    if (daysInRange > 0) {
      const rangeStartDate = addDays(start, startDay - 1);
      const rangeEndDate = addDays(start, endDay - 1);
      const subtotal = daysInRange * row.rate;
      totalCost += subtotal;

      rowsHtml += `
        <tr>
          <td>${formatDate(rangeStartDate)}</td>
          <td>${formatDate(rangeEndDate)}</td>
          <td>${daysInRange}</td>
          <td>${formatMoney(row.rate, row.currency)}</td>
          <td>${formatMoney(subtotal, row.currency)}</td>
        </tr>
      `;
    }
  });

  const notes = [...new Set(matchingRows.map((row) => row.notes).filter(Boolean))];

  resultBox.innerHTML = `
    <p>Dni wolne ${config.label.toLowerCase()} u tego armatora: <strong>${freeDays}</strong></p>
    <p>Liczba dni łącznie: <strong>${totalDays}</strong></p>
    <p>Dni przekroczone: <strong>${exceededDays}</strong></p>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Od</th>
            <th>Do</th>
            <th>Liczba dni</th>
            <th>Stawka za dzień</th>
            <th>Kwota</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || '<tr><td colspan="5">Brak dni płatnych.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="total">Łączny koszt ${config.label.toLowerCase()}: ${formatMoney(totalCost, matchingRows[0].currency)}</p>
    ${notes.length ? `<p class="note">Uwagi: ${notes.join(' | ')}</p>` : ''}
  `;
}

function showError(resultBox, message) {
  resultBox.innerHTML = `<p class="error">${message}</p>`;
}

function daysInclusive(start, end) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((stripTime(end) - stripTime(start)) / msPerDay) + 1;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toLocaleDateString('pl-PL');
}

function formatMoney(value, currency = 'EUR') {
  return `${Number(value).toFixed(2)} ${currency}`;
}
