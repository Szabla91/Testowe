Co zostało zrobione:
1. Stawki zostały wyniesione do pliku rates.csv.
2. Logika liczenia została uproszczona do jednej uniwersalnej funkcji w app.js.
3. Typ sekcji dla armatora jest wykrywany automatycznie na podstawie danych w CSV.
4. Żeby dodać lub poprawić stawki, edytujesz głównie plik rates.csv.

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

Uwaga:
- W danych ZIM przeniesiono obecne zakresy 1:1 z Twojego pliku, ale są oznaczone jako "Do weryfikacji", bo zaczynają się przed końcem free days.
- HMM nie został dodany, bo w obecnym kodzie nie było dla niego cenników.
- Jeśli otworzysz index.html bezpośrednio z dysku, przeglądarka może blokować odczyt CSV. Najlepiej testować przez GitHub Pages albo lokalny serwer.
