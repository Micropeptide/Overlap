// Errors the server reports, by their `code`. {field} is an API field name; it is left as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} musi być tekstem.',
  'errors.title_required': 'Dodaj tytuł.',
  'errors.name_required': 'Dodaj imię.',
  'errors.title_too_long': {
    one: 'Tytuł może mieć najwyżej {count} znak.',
    few: 'Tytuł może mieć najwyżej {count} znaki.',
    many: 'Tytuł może mieć najwyżej {count} znaków.',
    other: 'Tytuł może mieć najwyżej {count} znaku.',
  },
  'errors.description_too_long': {
    one: 'Opis może mieć najwyżej {count} znak.',
    few: 'Opis może mieć najwyżej {count} znaki.',
    many: 'Opis może mieć najwyżej {count} znaków.',
    other: 'Opis może mieć najwyżej {count} znaku.',
  },
  'errors.location_too_long': {
    one: 'Miejsce może mieć najwyżej {count} znak.',
    few: 'Miejsce może mieć najwyżej {count} znaki.',
    many: 'Miejsce może mieć najwyżej {count} znaków.',
    other: 'Miejsce może mieć najwyżej {count} znaku.',
  },
  'errors.note_too_long': {
    one: 'Notatka może mieć najwyżej {count} znak.',
    few: 'Notatka może mieć najwyżej {count} znaki.',
    many: 'Notatka może mieć najwyżej {count} znaków.',
    other: 'Notatka może mieć najwyżej {count} znaku.',
  },
  'errors.name_too_long': {
    one: 'Imię może mieć najwyżej {count} znak.',
    few: 'Imię może mieć najwyżej {count} znaki.',
    many: 'Imię może mieć najwyżej {count} znaków.',
    other: 'Imię może mieć najwyżej {count} znaku.',
  },
  'errors.not_whole_number': '{field} musi być liczbą całkowitą.',
  'errors.poll_not_object': 'Wyślij ankietę jako obiekt JSON.',
  'errors.closes_on_invalid': 'Wybierz prawidłową datę zamknięcia w ciągu najbliższych trzech lat.',
  'errors.closes_on_passed': 'Ta data zamknięcia już minęła. Wybierz dzisiejszą lub późniejszą.',
  'errors.timezone_invalid': 'Wybierz prawidłową strefę czasową, np. Europe/Warsaw.',
  'errors.kind_invalid': 'Wybierz konkretne daty albo dni tygodnia.',
  'errors.weekly_sent_dates': 'To ankieta cotygodniowa. Wyślij "weekdays" zamiast "dates".',
  'errors.weekdays_required': 'Wybierz co najmniej jeden dzień tygodnia.',
  'errors.weekdays_invalid': 'Dni tygodnia muszą być liczbami od 0 (niedziela) do 6 (sobota).',
  'errors.dates_sent_weekdays': 'Ta ankieta używa konkretnych dat. Wyślij "dates" zamiast "weekdays".',
  'errors.dates_required': 'Wybierz co najmniej jedną datę.',
  'errors.too_many_dates': {
    one: 'Wybierz najwyżej {count} datę.',
    few: 'Wybierz najwyżej {count} daty.',
    many: 'Wybierz najwyżej {count} dat.',
    other: 'Wybierz najwyżej {count} daty.',
  },
  'errors.date_invalid': '„{date}” nie jest prawidłową datą.',
  'errors.dates_out_of_range': 'Wybierz daty w ciągu najbliższych trzech lat.',
  'errors.dates_all_passed': 'Wszystkie te daty już minęły. Wybierz co najmniej jedną przyszłą datę.',
  'errors.slot_minutes_invalid': 'Dokładność godzin musi wynosić 15, 30 lub 60 minut.',
  'errors.end_before_start': 'Godzina końca musi być późniejsza niż godzina początku.',
  'errors.duration_invalid': 'Długość spotkania musi wynosić od 15 minut do 12 godzin.',
  'errors.allow_edits_invalid': 'Określ, czy goście mogą zmieniać odpowiedzi (true lub false).',
  'errors.visibility_invalid': 'Wybierz, kto widzi odpowiedzi.',
  'errors.times_misaligned': {
    one: 'Godziny początku i końca muszą pasować do kroku {count} min.',
    few: 'Godziny początku i końca muszą pasować do kroku {count} min.',
    many: 'Godziny początku i końca muszą pasować do kroku {count} min.',
    other: 'Godziny początku i końca muszą pasować do kroku {count} min.',
  },
  'errors.range_too_short': 'Przedział godzin jest krótszy niż jeden krok.',
  'errors.duration_too_long': 'Spotkanie jest dłuższe niż przedział godzin. Poszerz przedział albo skróć spotkanie.',
  'errors.too_many_slots': 'To za dużo terminów do wyboru. Wybierz mniej dat albo krótszy przedział.',
  'errors.no_slots': 'Żadna z tych godzin nie istnieje w tej strefie czasowej.',

  // Responses
  'errors.response_not_object': 'Wyślij odpowiedź jako obiekt JSON.',
  'errors.name_invisible': 'Dodaj imię, które da się zobaczyć.',
  'errors.not_time_list': '{field} musi być listą godzin.',

  // Final time
  'errors.final_required': 'Wybierz godzinę początku i końca.',
  'errors.final_end_before_start': 'Ostateczny termin musi kończyć się po swoim początku.',
  'errors.final_too_long': 'Ostateczny termin może trwać najwyżej 24 godziny.',
  'errors.final_bad_length': 'Długość ostatecznego terminu musi być wielokrotnością 5 minut.',
  'errors.final_not_a_time': 'Ostateczny termin musi zaczynać się o jednej z godzin w ankiecie.',

  // Requests
  'errors.too_many_requests': 'Za dużo żądań z tego połączenia. Odczekaj kilka minut i spróbuj ponownie.',
  'errors.json_required': 'Wyślij JSON z nagłówkiem Content-Type: application/json.',
  'errors.body_too_large': 'To żądanie jest za duże.',
  'errors.invalid_json': 'Treść żądania nie jest prawidłowym JSON-em.',
  'errors.method_not_allowed': 'Ta metoda nie jest tu dozwolona.',
  'errors.not_found': 'Nie znaleziono.',
  'errors.server_error': 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie.',

  // Polls and access
  'errors.poll_not_found': 'Ta ankieta nie istnieje. Mogła zostać usunięta albo wygasła.',
  'errors.admin_link_or_password_wrong': 'Ten prywatny link lub hasło są nieprawidłowe. Link mógł zostać zastąpiony albo hasło zmienione.',
  'errors.admin_link_invalid': 'Ten prywatny link jest nieprawidłowy. Mógł zostać zastąpiony.',
  'errors.changes_not_object': 'Wyślij zmiany jako obiekt JSON.',
  'errors.reopen_with_final': 'Ponowne otwarcie ankiety usuwa jej ostateczny termin, więc wyślij jedno albo drugie.',
  'errors.status_invalid': 'Status musi mieć wartość "open" lub "closed".',
  'errors.no_final_time': 'Ta ankieta nie ma jeszcze ostatecznego terminu.',

  // Answering
  'errors.poll_closed': 'Ta ankieta jest zamknięta, więc nie przyjmuje nowych odpowiedzi.',
  'errors.poll_closed_no_changes': 'Ta ankieta jest zamknięta, więc nie można już zmieniać odpowiedzi.',
  'errors.edits_not_allowed': 'Organizator nie pozwala zmieniać odpowiedzi po wysłaniu. Swoją możesz nadal usunąć.',
  'errors.too_many_responses': {
    one: 'Ta ankieta ma już {count} odpowiedź.',
    few: 'Ta ankieta ma już {count} odpowiedzi.',
    many: 'Ta ankieta ma już {count} odpowiedzi.',
    other: 'Ta ankieta ma już {count} odpowiedzi.',
  },
  'errors.name_taken': 'Ktoś już odpowiedział jako „{name}”. Jeśli to ty, otwórz swój prywatny link do edycji. Jeśli nie, dodaj inicjał nazwiska.',
  'errors.name_taken_other': 'Ktoś inny już odpowiedział jako „{name}”. Spróbuj dodać inicjał nazwiska.',
  'errors.response_not_found': 'Ta odpowiedź już nie istnieje.',
  'errors.my_response_not_found': 'Nie znaleźliśmy twojej odpowiedzi. Mogła zostać usunięta.',
  'errors.not_your_response': 'Tę odpowiedź może zmienić tylko osoba, która ją wysłała.',

  // Passwords
  'errors.password_unreadable': 'Nie udało się odczytać hasła. Odśwież stronę i spróbuj ponownie.',
  'errors.too_many_wrong_passwords': 'Za dużo błędnych haseł dla tej ankiety. Odczekaj godzinę i spróbuj ponownie albo użyj prywatnego linku.',
  'errors.password_no_longer_works': 'To hasło już nie działa dla tej odpowiedzi. Mogło zostać zmienione.',
  'errors.sign_in_incomplete': 'Podaj imię użyte w odpowiedzi i swoje hasło.',
  'errors.sign_in_failed': 'To imię i hasło nie pasują do żadnej odpowiedzi z hasłem. Sprawdź pisownię albo użyj prywatnego linku do edycji.',

  // Email
  'errors.email_not_set_up': 'E-mail nie jest skonfigurowany w tej kopii Overlap.',
  'errors.email_invalid': 'To nie wygląda na adres e-mail.',
  'errors.link_not_current': 'Ten prywatny link jest nieaktualny. Odśwież stronę i spróbuj ponownie.',
  'errors.email_nothing_chosen': 'Wybierz, co wysłać e-mailem: link, powiadomienia albo jedno i drugie.',
  'errors.email_daily_limit': 'Overlap wysłał już dziś wystarczająco dużo e-maili na ten adres (lub dla tej ankiety). Spróbuj jutro.',
  'errors.email_send_failed': 'Nie udało się teraz wysłać e-maila. Spróbuj ponownie za minutę.',
  'errors.confirm_link_expired': 'Ten link potwierdzający wygasł albo został już zastąpiony. Poproś ponownie o e-maile na stronie ankiety.',
};
