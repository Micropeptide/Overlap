// The privacy page. Every statement describes what the code actually does:
// translations keep the exact meaning, adding or dropping nothing.
export default {
  'privacy.tabTitle': 'Privacy',
  'privacy.title': 'Privacy',
  'privacy.ledeRetention': 'Overlap verzamelt alleen wat nodig is om een tijd te vinden, bewaart het een beperkte tijd en laat je het verwijderen wanneer je maar wilt.',
  'privacy.ledeKept': 'Overlap verzamelt alleen wat nodig is om een tijd te vinden en laat je het verwijderen wanneer je maar wilt.',

  'privacy.storesHeading': 'Wat Overlap opslaat',
  'privacy.storesPoll': 'Per peiling: de naam, en als de organisator die toevoegt, een bericht, een plaats of gesprekslink en een sluitingsdatum. Verder de aangeboden datums (of dagen van de week) en tijden, de tijdzone, de duur van de afspraak, wie de reacties kan zien, en of de peiling open of gesloten is of een definitief tijdstip heeft.',
  'privacy.storesResponse': 'Per reactie: de weergavenaam die de gast heeft ingevuld, de gemarkeerde tijden (voorkeur, beschikbaar of indien nodig) en de optionele opmerking.',
  'privacy.storesTimestamps': 'Wanneer elke peiling en reactie is gemaakt en voor het laatst gewijzigd.',
  'privacy.storesLinkHash': 'Een onherkenbaar gemaakte vingerafdruk (een SHA-256-hash) van elke privélink, zodat de server een link kan controleren zonder er een kopie van te bewaren.',
  'privacy.storesPasswordHash': 'Als een organisator of gast een optioneel wachtwoord toevoegt: een SHA-256-hash van een sleutel die in de eigen browser van dat wachtwoord is gemaakt. Nooit het wachtwoord zelf.',
  'privacy.storesAttempts': 'Hoeveel verkeerde wachtwoorden er het afgelopen uur voor elke peiling zijn geprobeerd (één getal per peiling, zonder gegevens over verbinding of apparaat), om raden tegen te gaan.',
  'privacy.storesEmail': 'Alleen als je om e-mailupdates vraagt: je e-mailadres, of je het hebt bevestigd en wanneer je voor het laatst een e-mail kreeg. Zolang iemand een peiling per e-mail volgt, houdt Overlap ook een korte lijst bij van wat er wanneer is gewijzigd (bijvoorbeeld “er is een reactie toegevoegd”, met de id van die reactie), zodat de volgende e-mail kan vertellen wat er nieuw is. Die lijst wordt na 30 dagen gewist.',

  'privacy.notCollectedHeading': 'Wat Overlap niet verzamelt',
  'privacy.noAccountsWithEmails': 'Geen accounts of telefoonnummers, en geen e-mailadres tenzij je om e-mails vraagt.',
  'privacy.noAccounts': 'Geen accounts, e-mailadressen of telefoonnummers.',
  'privacy.passwordsLocal': 'Optionele wachtwoorden verlaten je browser nooit. Die maakt van het wachtwoord een sleutel (PBKDF2-SHA-256, 210.000 rondes, gezouten met de peiling) en verstuurt alleen die sleutel, en de server bewaart alleen een hash van de sleutel.',
  'privacy.noCalendar': 'Geen toegang tot je agenda.',
  'privacy.noTracking': 'Geen cookies, analytics, advertenties, trackingpixels of scripts van derden. Lettertypen komen van deze site zelf.',
  'privacy.noIpLogs': 'Overlap schrijft geen IP-adressen weg in zijn database of logs. Om misbruik af te remmen telt het verzoeken per verbinding in het geheugen, ongeveer een uur lang, en vergeet ze daarna.',
  'privacy.hostingCloudflare': 'Deze installatie van Overlap wordt gehost door twee bedrijven: GitHub Pages levert de pagina’s, en Cloudflare draait het deel dat de peilingen opslaat (in zijn D1-database). Beide zien je IP-adres als je verbinding maakt en kunnen hun eigen netwerklogs bijhouden. Overlap zet de optionele verzoeklogging van Cloudflare uit.',
  'privacy.hostingOther': 'Het bedrijf dat een installatie van Overlap host, kan zijn eigen netwerklogs bijhouden.',
  'privacy.resend': 'E-mails worden verstuurd door Resend (resend.com). Resend ontvangt het adres en de inhoud van de e-mail om die te bezorgen, en bewaart zijn eigen bezorggegevens volgens zijn privacybeleid. Overlap stuurt niets naar Resend tenzij je om een e-mail vraagt.',
  'privacy.calendarLinks': 'Heeft een peiling een definitief tijdstip, dan kun je het openen in Google Agenda of Outlook.com. Klik je op een van die links, dan krijgt dat bedrijf de naam, het tijdstip, de plaats en het bericht van de afspraak en de gastlink van de peiling, en iedereen met de gastlink kan de peiling zien (en, tenzij de resultaten verborgen zijn, ieders namen en tijden). Er wordt niets verstuurd tenzij je klikt.',

  'privacy.whoHeading': 'Wie wat kan zien',
  'privacy.guestLink': 'De gastlink toont de peiling aan iedereen die hem heeft. Standaard kunnen gasten ook elkaars namen en tijden zien. De organisator kan dit veranderen in “Alleen ik”; de server stuurt dan geen reacties van anderen meer naar gasten.',
  'privacy.privateLink': 'Met de privélink kan wie hem heeft de peiling bewerken, sluiten of verwijderen en reacties verwijderen. De organisator kan hem op elk moment vervangen, waarna de oude niet meer werkt.',
  'privacy.guestEditLink': 'Elke gast krijgt een privé-bewerklink waarmee alleen de eigen reactie kan worden gewijzigd of verwijderd. Wie de naam van iemand anders intypt, krijgt geen toegang tot diens reactie.',
  'privacy.passwordAccess': 'Een gast die een wachtwoord toevoegt, kan de eigen reactie ook op een ander apparaat openen met de eigen naam en dat wachtwoord. Een organisator die een wachtwoord instelt, kan daarmee de organisatorweergave openen vanaf de gastlink. Beide wachtwoorden kunnen later worden gewijzigd of verwijderd.',
  'privacy.hiddenResults': 'Als de resultaten op “Alleen ik” staan, zien gasten nog wel hoeveel mensen hebben gereageerd, maar niet wie. Namen hoeven dan ook niet uniek te zijn, dus het uitproberen van een naam verraadt ook niets.',
  'privacy.emailPrivate': 'Je e-mailadres wordt nooit getoond aan de organisator, aan gasten of op welke pagina dan ook. Alleen degene die het heeft toegevoegd, kan het zien of wijzigen, vanaf de pagina waarop het is toegevoegd. Update-e-mails bevatten geen privélinks; alleen een e-mail waarin je om je link vraagt, bevat die.',
  'privacy.browserStorage': 'Je browser bewaart sommige dingen in zijn eigen opslag, alleen op je apparaat: de privélinks die je gebruikt (of de van wachtwoorden afgeleide sleutels waarmee je bent ingelogd), de laatste naam die je hebt ingevuld, je voorkeurstijdzone en formulierinstellingen, en een reactie die je nog niet hebt verstuurd (de markeringen, naam en opmerking, zodat ze niet verloren gaan als je de pagina opnieuw laadt). “Peiling dupliceren” bewaart de instellingen, titel, het bericht en de plaats van de peiling kort in de sessieopslag van het tabblad. Als je je browsergegevens wist, verdwijnt dit allemaal; de server van Overlap ziet het nooit.',

  'privacy.retentionHeading': 'Hoe lang gegevens worden bewaard',
  // The paragraph is whole sentences; these two only set their order and spacing.
  'privacy.retentionParagraph': '{policy} {anytime} {afterDelete}',
  'privacy.retentionParagraphEmails': '{policy} {anytime} {emails} {afterDelete}',
  'privacy.retentionAuto': {
    one: 'Een peiling en alle reacties worden automatisch verwijderd {count} dag na de laatste datum in de peiling. Een wekelijkse peiling heeft geen laatste datum en wordt daarom verwijderd {count} dag na de laatste wijziging: een bewerking, of een reactie die wordt toegevoegd of bijgewerkt.',
    other: 'Een peiling en alle reacties worden automatisch verwijderd {count} dagen na de laatste datum in de peiling. Een wekelijkse peiling heeft geen laatste datum en wordt daarom verwijderd {count} dagen na de laatste wijziging: een bewerking, of een reactie die wordt toegevoegd of bijgewerkt.',
  },
  'privacy.retentionKept': 'Overlap verwijdert peilingen niet uit zichzelf: een peiling en de reacties blijven bestaan tot de organisator de peiling verwijdert.',
  'privacy.deleteAnytime': 'Organisatoren kunnen een peiling op elk moment verwijderen, en gasten kunnen hun eigen reactie op elk moment verwijderen, ook nadat de peiling is gesloten.',
  'privacy.emailDeletion': 'Een e-mailadres wordt verwijderd als je de e-mails stopt (vanaf de pagina van de peiling of via de link in een e-mail), als je je reactie verwijdert of als de peiling wordt verwijderd. Een adres dat alleen wordt gebruikt om je je link te sturen, wordt helemaal niet opgeslagen.',
  'privacy.deletedCloudflare': {
    one: 'Verwijderde gegevens worden meteen uit de live database gehaald. De database van Cloudflare houdt {count} dag lang een automatische herstelgeschiedenis bij, dus zo lang kan een verwijderde peiling nog worden teruggezet door wie deze installatie van Overlap beheert; daarna is ze weg.',
    other: 'Verwijderde gegevens worden meteen uit de live database gehaald. De database van Cloudflare houdt {count} dagen lang een automatische herstelgeschiedenis bij, dus zo lang kan een verwijderde peiling nog worden teruggezet door wie deze installatie van Overlap beheert; daarna is ze weg.',
  },
  'privacy.deletedOther': 'Verwijderde gegevens worden meteen overschreven in het databasebestand (de secure delete van SQLite, plus het leegmaken van de write-ahead log). Als wie deze installatie van Overlap beheert back-ups maakt, kan er een kopie in die back-ups blijven staan tot ze verlopen.',

  'privacy.securityHeading': 'Beveiliging, eerlijk gezegd',
  'privacy.securityLinks': 'Links bevatten lange willekeurige sleutels die in de praktijk niet te raden zijn. Privésleutels staan na het “#” in de link; dat deel sturen browsers niet naar de server of naar andere sites, en de server ontvangt ze alleen in een header van een verzoek. Pagina’s gebruiken een strikte Content Security Policy en sturen geen referrer mee.',
  'privacy.securityPasswords': 'Een wachtwoord is maar zo sterk als je het zelf maakt. Na 30 verkeerde wachtwoorden binnen een uur accepteert een peiling geen wachtwoorden meer (goed of fout) tot het uur voorbij is; links blijven wel werken. Iemand die een kopie van de database in handen krijgt, zou een zwak wachtwoord offline nog steeds kunnen proberen te raden, dus gebruik er een dat je nergens anders gebruikt.',
  // {transit} is privacy.httpsCloudflare or privacy.httpsOther, a whole sentence.
  'privacy.securityEncryption': 'Overlap versleutelt de inhoud van peilingen niet in zijn database, en reacties zijn niet anoniem: iedereen aan wie je de gastlink geeft, kan namen en tijden zien. {transit} Gebruik Overlap niet voor iets gevoeligs.',
  'privacy.httpsCloudflare': 'Deze installatie is alleen bereikbaar via HTTPS, dus verbindingen zijn versleuteld tijdens het transport.',
  'privacy.httpsOther': 'Verbindingen zijn alleen versleuteld als deze installatie van Overlap via HTTPS wordt aangeboden.',

  'privacy.sourceHeading': 'Broncode',
  // {link} is the repository address, github.com/Micropeptide/Overlap.
  'privacy.source': 'Overlap is een kleine, onafhankelijke opensource-app (MIT-licentie) van Micropeptide: {link}. Het is geïnspireerd door de opensource-planner Timeful, maar deelt er geen code mee.',
};
