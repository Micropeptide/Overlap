// The privacy page. Every statement describes what the code actually does:
// translations must keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': 'Prywatność',
  'privacy.title': 'Prywatność',
  'privacy.ledeRetention': 'Overlap zbiera tylko to, czego potrzebuje do znalezienia terminu, przechowuje to przez ograniczony czas i pozwala ci usunąć to, kiedy chcesz.',
  'privacy.ledeKept': 'Overlap zbiera tylko to, czego potrzebuje do znalezienia terminu, i pozwala ci usunąć to, kiedy chcesz.',

  'privacy.storesHeading': 'Co przechowuje Overlap',
  'privacy.storesPoll': 'Dla każdej ankiety: jej nazwę oraz, jeśli organizator je doda, notatkę, miejsce lub link do rozmowy i datę zamknięcia. Ponadto proponowane daty (lub dni tygodnia) i godziny, strefę czasową, długość spotkania, to, kto widzi odpowiedzi, oraz to, czy ankieta jest otwarta, zamknięta lub ma ostateczny termin.',
  'privacy.storesResponse': 'Dla każdej odpowiedzi: wyświetlane imię wpisane przez gościa, zaznaczone przez niego terminy (preferowane, pasujące lub ewentualne) i jego opcjonalną notatkę.',
  'privacy.storesTimestamps': 'Kiedy każda ankieta i odpowiedź zostały utworzone i ostatnio zmienione.',
  'privacy.storesLinkHash': 'Zakodowany odcisk (skrót SHA-256) każdego prywatnego linku, aby serwer mógł sprawdzić link bez przechowywania jego kopii.',
  'privacy.storesPasswordHash': 'Jeśli organizator lub gość doda opcjonalne hasło: skrót SHA-256 klucza utworzonego z tego hasła w jego przeglądarce. Nigdy samo hasło.',
  'privacy.storesAttempts': 'Ile błędnych haseł wpisano dla każdej ankiety w ciągu ostatniej godziny (jedna liczba na ankietę, bez danych o połączeniu ani urządzeniu), aby powstrzymać zgadywanie.',
  'privacy.storesEmail': 'Tylko jeśli poprosisz o powiadomienia e-mail: twój adres e-mail, informację, czy został potwierdzony, i kiedy ostatnio wysłano do ciebie e-mail. Dopóki ktoś śledzi ankietę przez e-mail, Overlap przechowuje też krótką listę tego, co i kiedy się zmieniło (na przykład „dodano odpowiedź” wraz z identyfikatorem odpowiedzi), aby następny e-mail mógł podać, co nowego. Ta lista jest czyszczona po 30 dniach.',

  'privacy.notCollectedHeading': 'Czego Overlap nie zbiera',
  'privacy.noAccountsWithEmails': 'Żadnych kont ani numerów telefonu, a adresu e-mail tylko wtedy, gdy poprosisz o e-maile.',
  'privacy.noAccounts': 'Żadnych kont, adresów e-mail ani numerów telefonu.',
  'privacy.passwordsLocal': 'Opcjonalne hasła nigdy nie opuszczają twojej przeglądarki. Przeglądarka zamienia hasło w klucz (PBKDF2-SHA-256, 210 000 rund, z solą opartą na ankiecie), wysyła tylko ten klucz, a serwer przechowuje tylko skrót tego klucza.',
  'privacy.noCalendar': 'Żadnego dostępu do kalendarza.',
  'privacy.noTracking': 'Żadnych plików cookie, analityki, reklam, pikseli śledzących ani skryptów firm trzecich. Czcionki są serwowane z tej witryny.',
  'privacy.noIpLogs': 'Overlap nie zapisuje adresów IP w swojej bazie danych ani w logach. Aby ograniczać nadużycia, zlicza żądania z każdego połączenia w pamięci przez mniej więcej godzinę, a potem o nich zapomina.',
  'privacy.hostingCloudflare': 'Ta kopia Overlap jest hostowana przez dwie firmy: GitHub Pages serwuje strony, a Cloudflare obsługuje część, która przechowuje ankiety (w swojej bazie danych D1). Obie widzą twój adres IP, gdy się łączysz, i mogą prowadzić własne logi sieciowe. Overlap wyłącza opcjonalne logowanie żądań w Cloudflare.',
  'privacy.hostingOther': 'Firma hostująca kopię Overlap może prowadzić własne logi sieciowe.',
  'privacy.resend': 'E-maile wysyła Resend (resend.com), który otrzymuje adres i treść e-maila, aby go dostarczyć, i prowadzi własne rejestry dostarczania zgodnie ze swoją polityką prywatności. Overlap nie wysyła niczego do Resend, chyba że poprosisz o e-mail.',
  'privacy.calendarLinks': 'Jeśli ankieta ma ostateczny termin, możesz otworzyć go w Kalendarzu Google lub w Outlook.com. Kliknięcie jednego z tych linków przekazuje tej firmie nazwę wydarzenia, termin, miejsce, notatkę i link dla gości do ankiety, a każdy, kto ma link dla gości, może zobaczyć ankietę (oraz, jeśli wyniki nie są ukryte, imiona i terminy wszystkich). Nic nie jest wysyłane, dopóki nie klikniesz.',

  'privacy.whoHeading': 'Kto co widzi',
  'privacy.guestLink': 'Link dla gości pokazuje ankietę każdemu, kto go ma. Domyślnie goście widzą też nawzajem swoje imiona i terminy. Organizator może zmienić to ustawienie na „Tylko ja” – wtedy serwer przestaje wysyłać gościom odpowiedzi innych osób.',
  'privacy.privateLink': 'Prywatny link pozwala każdemu, kto go ma, edytować, zamknąć lub usunąć ankietę oraz usuwać odpowiedzi. Organizator może go w każdej chwili zastąpić, a wtedy stary przestaje działać.',
  'privacy.guestEditLink': 'Każdy gość dostaje prywatny link do edycji, który pozwala zmienić lub usunąć tylko jego własną odpowiedź. Wpisanie czyjegoś imienia nie daje dostępu do odpowiedzi tej osoby.',
  'privacy.passwordAccess': 'Gość, który doda hasło, może też otworzyć swoją odpowiedź na innym urządzeniu za pomocą imienia i tego hasła. Organizator, który ustawi hasło, może za jego pomocą otworzyć widok organizatora z linku dla gości. Każde z tych haseł można później zmienić lub usunąć.',
  'privacy.hiddenResults': 'Gdy wyniki są ustawione na „Tylko ja”, goście nadal widzą, ile osób odpowiedziało, ale nie kto. W takim przypadku imiona nie muszą być unikalne, więc wpisanie imienia również niczego nie zdradza.',
  'privacy.emailPrivate': 'Twój adres e-mail nigdy nie jest pokazywany organizatorowi, gościom ani na żadnej stronie. Tylko osoba, która go dodała, może go zobaczyć lub zmienić, na stronie, na której go dodała. E-maile z powiadomieniami nie zawierają prywatnych linków; zawiera je tylko e-mail, w którym prosisz o swój link.',
  'privacy.browserStorage': 'Twoja przeglądarka przechowuje niektóre rzeczy we własnej pamięci, wyłącznie na twoim urządzeniu: używane przez ciebie prywatne linki (lub klucze utworzone z haseł, którymi się logujesz), ostatnio wpisane imię, preferowaną strefę czasową i ustawienia formularza oraz jeszcze niewysłaną odpowiedź (jej zaznaczenia, imię i notatkę, aby odświeżenie strony ich nie skasowało). „Duplikuj ankietę” na krótko przechowuje ustawienia, tytuł, notatkę i miejsce ankiety w pamięci sesji karty. Wyczyszczenie danych przeglądarki usuwa to wszystko; serwer Overlap nigdy tego nie widzi.',

  'privacy.retentionHeading': 'Jak długo dane są przechowywane',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy} {anytime} {afterDelete}',
  'privacy.retentionParagraphEmails': '{policy} {anytime} {emails} {afterDelete}',
  'privacy.retentionAuto': {
    one: 'Ankieta i wszystkie jej odpowiedzi są usuwane automatycznie {count} dzień po ostatniej dacie w ankiecie. Ankieta cotygodniowa nie ma ostatniej daty, więc jest usuwana {count} dzień po ostatniej zmianie: edycji albo dodaniu lub aktualizacji odpowiedzi.',
    few: 'Ankieta i wszystkie jej odpowiedzi są usuwane automatycznie {count} dni po ostatniej dacie w ankiecie. Ankieta cotygodniowa nie ma ostatniej daty, więc jest usuwana {count} dni po ostatniej zmianie: edycji albo dodaniu lub aktualizacji odpowiedzi.',
    many: 'Ankieta i wszystkie jej odpowiedzi są usuwane automatycznie {count} dni po ostatniej dacie w ankiecie. Ankieta cotygodniowa nie ma ostatniej daty, więc jest usuwana {count} dni po ostatniej zmianie: edycji albo dodaniu lub aktualizacji odpowiedzi.',
    other: 'Ankieta i wszystkie jej odpowiedzi są usuwane automatycznie {count} dnia po ostatniej dacie w ankiecie. Ankieta cotygodniowa nie ma ostatniej daty, więc jest usuwana {count} dnia po ostatniej zmianie: edycji albo dodaniu lub aktualizacji odpowiedzi.',
  },
  'privacy.retentionKept': 'Overlap nie usuwa ankiet samodzielnie: ankieta i jej odpowiedzi zostają, dopóki organizator nie usunie ankiety.',
  'privacy.deleteAnytime': 'Organizatorzy mogą w każdej chwili usunąć ankietę, a goście mogą w każdej chwili usunąć swoją odpowiedź, nawet po zamknięciu ankiety.',
  'privacy.emailDeletion': 'Adres e-mail jest usuwany, gdy wyłączysz e-maile (na stronie ankiety lub linkiem z dowolnego e-maila), gdy usuniesz swoją odpowiedź albo gdy ankieta zostanie usunięta. Adres użyty tylko do wysłania ci linku w ogóle nie jest zapisywany.',
  'privacy.deletedCloudflare': {
    one: 'Usunięte dane są od razu usuwane z bieżącej bazy danych. Baza danych Cloudflare przechowuje automatyczną historię przywracania przez {count} dzień, więc przez ten czas osoba prowadząca tę kopię Overlap mogłaby jeszcze odzyskać usuniętą ankietę; potem znika ona bezpowrotnie.',
    few: 'Usunięte dane są od razu usuwane z bieżącej bazy danych. Baza danych Cloudflare przechowuje automatyczną historię przywracania przez {count} dni, więc przez ten czas osoba prowadząca tę kopię Overlap mogłaby jeszcze odzyskać usuniętą ankietę; potem znika ona bezpowrotnie.',
    many: 'Usunięte dane są od razu usuwane z bieżącej bazy danych. Baza danych Cloudflare przechowuje automatyczną historię przywracania przez {count} dni, więc przez ten czas osoba prowadząca tę kopię Overlap mogłaby jeszcze odzyskać usuniętą ankietę; potem znika ona bezpowrotnie.',
    other: 'Usunięte dane są od razu usuwane z bieżącej bazy danych. Baza danych Cloudflare przechowuje automatyczną historię przywracania przez {count} dnia, więc przez ten czas osoba prowadząca tę kopię Overlap mogłaby jeszcze odzyskać usuniętą ankietę; potem znika ona bezpowrotnie.',
  },
  'privacy.deletedOther': 'Usunięte dane są od razu nadpisywane w pliku bazy danych (bezpieczne usuwanie SQLite oraz opróżnianie dziennika zapisu z wyprzedzeniem). Jeśli osoba prowadząca tę kopię Overlap robi kopie zapasowe, kopia danych może w nich pozostać do czasu ich wygaśnięcia.',

  'privacy.securityHeading': 'Bezpieczeństwo, szczerze',
  'privacy.securityLinks': 'Linki zawierają długie losowe klucze, których praktycznie nie da się odgadnąć. Prywatne klucze są przesyłane w części linku po znaku „#”, której przeglądarki nie wysyłają do serwera ani do innych witryn, a serwer otrzymuje je wyłącznie w nagłówku żądania. Strony stosują ścisłą politykę bezpieczeństwa treści (CSP) i nie wysyłają nagłówka Referer.',
  'privacy.securityPasswords': 'Hasło jest tak silne, jak je ustawisz. Po 30 błędnych hasłach w ciągu godziny ankieta przestaje przyjmować hasła (prawidłowe i błędne) aż do upływu tej godziny, a linki nadal działają. Ktoś, kto zdobyłby kopię bazy danych, mógłby nadal próbować odgadnąć słabe hasło offline, więc użyj hasła, którego nie używasz nigdzie indziej.',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlap nie szyfruje treści ankiet w swojej bazie danych, a odpowiedzi nie są anonimowe: każdy, komu dasz link dla gości, może zobaczyć imiona i terminy. {transit} Nie używaj Overlap do niczego poufnego.',
  'privacy.httpsCloudflare': 'Ta kopia jest dostępna wyłącznie przez HTTPS, więc połączenia są szyfrowane podczas przesyłania.',
  'privacy.httpsOther': 'Połączenia są szyfrowane tylko wtedy, gdy ta kopia Overlap jest udostępniana przez HTTPS.',

  'privacy.sourceHeading': 'Kod źródłowy',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlap to mała, niezależna aplikacja open source (licencja MIT) autorstwa Micropeptide: {link}. Inspiracją był otwartoźródłowy planer Timeful, ale Overlap nie ma z nim wspólnego kodu.',
};
