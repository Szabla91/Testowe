Kalkulator dem/det oraz storage dla Polskich portów

Jak aktualizować stawki:
- Otwórz rates.csv w Excelu.
- Zachowaj dokładnie te kolumny:
  carrier, chargeType, port, containerType, freeDays, dayFrom, dayTo, rate, currency, notes
- dayTo może mieć wartość Infinity dla ostatniego progu.
- Po zmianach zapisz plik jako CSV UTF-8.
- Wgraj podmieniony rates.csv na GitHub obok index.html.

Dozwolone wartości chargeType:
- demdet
- demurrage
- detention
- storage
