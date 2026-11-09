// Substantive security guidance for existing Italian, Portuguese and Polish guides.
export const essentialSecurityItPtPl={
  "secure-accounts": {
    "localeSources": {
      "it": [
        {
          "label": "CERT-AGID — Riconoscere il phishing e proteggere le credenziali",
          "url": "https://cert-agid.gov.it/download/Phishing-Cert-PA.pdf"
        }
      ],
      "pt": [
        {
          "label": "CNCS Portugal — Internet Segura: Ler Antes, Clicar Depois",
          "url": "https://www.cncs.gov.pt/docs/lerantesclicardepois-1.pdf"
        }
      ],
      "pl": [
        {
          "label": "CERT Polska — Jak tworzyć bezpieczne hasła i chronić swoje konta",
          "url": "https://wiedza.cert.pl/dobre-praktyki/hasla/"
        }
      ]
    },
    "it": {
      "title": "Proteggere gli account online: controllo pratico di password e accessi",
      "subtitle": "Una guida per mettere al sicuro email, banca e servizi digitali con password uniche, autenticazione a più fattori e recupero degli account.",
      "sections": [
        [
          "Parti dagli account da cui dipendono tutti gli altri",
          "Prepara un elenco con la casella email principale, il gestore delle password, il conto bancario, il numero di telefono, lo spazio cloud e i social. La casella email è prioritaria perché molti servizi inviano lì i collegamenti per reimpostare le credenziali. Apri le impostazioni da un segnalibro affidabile o dall'app ufficiale, non da una richiesta urgente ricevuta per messaggio. Controlla gli indirizzi di recupero, i numeri associati e l'elenco dei dispositivi connessi; chiudi le sessioni che non riconosci."
        ],
        [
          "Usa una password lunga e diversa per ogni servizio",
          "Riutilizzare la stessa password su più siti significa esporre molti account quando uno solo subisce una violazione. Un gestore di password affidabile può creare credenziali casuali distinte e conservarle in un archivio protetto. Scegli per l'archivio una frase segreta lunga, che non usi altrove, e attiva i controlli aggiuntivi disponibili. Evita di salvare password in note non cifrate o fotografie della schermata. Inizia da email e banca, poi sostituisci gradualmente le altre password ripetute."
        ],
        [
          "Preferisci passkey e chiavi di sicurezza contro il phishing",
          "Quando il servizio le supporta, le passkey e le chiavi FIDO2 collegano l'accesso al sito autentico e riducono il rischio di immettere un segreto in una pagina contraffatta. I codici generati da un'app di autenticazione aggiungono un livello utile, ma possono ancora essere estorti con l'inganno. Gli SMS possono essere più fragili in caso di compromissione del numero telefonico. Dopo aver attivato un nuovo metodo, verifica quali procedure alternative restano abilitate: una vecchia opzione debole può ancora consentire l'accesso."
        ],
        [
          "Prepara il recupero prima di smarrire lo smartphone",
          "Verifica che l'indirizzo secondario e il numero di recupero siano ancora sotto il tuo controllo. Conserva i codici di emergenza in un luogo sicuro e separato dal dispositivo che potresti perdere. Se usi una chiave fisica, valuta la registrazione di una seconda chiave di riserva. Informati sulla procedura ufficiale di recupero, ma non eliminare contemporaneamente tutti i metodi di accesso funzionanti. Non condividere codici o password con chi afferma di chiamare dall'assistenza tecnica."
        ],
        [
          "Controlla periodicamente accessi, autorizzazioni e aggiornamenti",
          "Apri la cronologia degli accessi e rivedi le applicazioni collegate agli account: revoca i permessi che non servono o che non riconosci. Mantieni aggiornati browser, sistema operativo e telefono e usa il blocco schermo. Se ricevi una comunicazione secondo cui un account verrà chiuso immediatamente, raggiungi il servizio in autonomia invece di aprire il collegamento contenuto nel messaggio. In caso di accesso sospetto, utilizza il recupero ufficiale da un dispositivo attendibile e termina le sessioni sconosciute."
        ]
      ]
    },
    "pt": {
      "title": "Como proteger as contas online: verificação de segurança passo a passo",
      "subtitle": "Reforce o acesso ao email, banco e redes sociais com palavras-passe únicas, autenticação resistente a phishing e recuperação preparada.",
      "sections": [
        [
          "Comece pelas contas que dão acesso às restantes",
          "Faça uma lista do email principal, operador móvel, gestor de palavras-passe, banco, armazenamento na nuvem e redes sociais. O email merece atenção especial, porque muitos serviços enviam para essa caixa as ligações de recuperação. Abra as definições através da aplicação oficial ou de um endereço que já conhece, e não de uma ligação inesperada numa mensagem. Confirme se os contactos alternativos continuam corretos, veja os dispositivos associados e termine as sessões que não reconhece."
        ],
        [
          "Utilize uma palavra-passe exclusiva e longa em cada serviço",
          "Se usar a mesma palavra-passe em vários sítios, uma fuga de dados num deles pode comprometer os outros. Um gestor de palavras-passe ajuda a criar combinações aleatórias diferentes e a guardá-las numa área protegida. Proteja o próprio gestor com uma frase-passe longa e que não repita em nenhum outro serviço. Não guarde listas de credenciais em notas desprotegidas ou capturas de ecrã facilmente acessíveis. Comece pelo email, banco e ficheiros pessoais, e depois substitua as restantes palavras-passe repetidas."
        ],
        [
          "Ative a autenticação que melhor resiste a páginas falsas",
          "Sempre que estejam disponíveis, considere as passkeys ou chaves físicas FIDO2 para as contas mais importantes. Estes métodos validam o endereço legítimo do serviço, dificultando a recolha de credenciais através de uma página de phishing. Os códigos de uma aplicação autenticadora são uma alternativa útil, embora ainda possam ser pedidos por um burlão. Os SMS apresentam outras fragilidades, incluindo a apropriação do número. Depois de ativar uma passkey, confirme se os métodos antigos continuam disponíveis como entrada alternativa."
        ],
        [
          "Prepare a recuperação antes de perder o telemóvel",
          "Verifique se consegue utilizar o endereço de email secundário e o número de contacto guardados na conta. Arquive os códigos de recuperação de utilização única num local protegido e separado do aparelho principal. Se utilizar uma chave de segurança, pode registar uma segunda chave guardada noutro lugar. Leia antecipadamente as instruções oficiais do fornecedor, mas evite terminar todas as sessões ou eliminar o único método de acesso que funciona. Nunca entregue códigos de confirmação a alguém que se apresenta como apoio ao cliente."
        ],
        [
          "Repita uma revisão rápida e desconfie da urgência",
          "Consulte os acessos recentes e a lista de aplicações externas que receberam permissões para usar a conta. Revogue os acessos desconhecidos, mantenha o telemóvel e o navegador atualizados e ative o bloqueio do ecrã. Mensagens a exigir uma ação imediata para impedir o bloqueio de uma conta devem ser confirmadas diretamente no serviço, sem seguir a ligação recebida. Se suspeitar de intrusão, use os procedimentos oficiais a partir de um dispositivo fiável e termine as sessões não autorizadas."
        ]
      ]
    },
    "pl": {
      "title": "Jak zabezpieczyć konta internetowe: kontrola haseł i logowania",
      "subtitle": "Praktyczne wskazówki dla poczty, bankowości i mediów społecznościowych: unikalne hasła, klucze dostępu i bezpieczne odzyskiwanie konta.",
      "sections": [
        [
          "Zacznij od kont, które pozwalają odzyskać dostęp do innych",
          "Spisz najważniejsze usługi: główną skrzynkę pocztową, operatora telefonu, menedżer haseł, bank, dysk w chmurze i media społecznościowe. Poczta jest szczególnie ważna, ponieważ na ten adres trafiają łącza do resetowania wielu innych haseł. Ustawienia otwieraj z zapisanej zakładki albo oficjalnej aplikacji, a nie z nieoczekiwanej wiadomości. Sprawdź adresy i numery odzyskiwania oraz listę zalogowanych urządzeń. Wyloguj nieznane sesje i usuń przestarzałe dane kontaktowe."
        ],
        [
          "Każdy serwis powinien mieć inne, długie hasło",
          "Hasło używane na kilku stronach naraża wszystkie te konta, gdy jedna witryna ujawni dane logowania. Menedżer haseł pozwala tworzyć losowe, niepowtarzalne hasła i przechowywać je w chronionym sejfie. Do otwierania sejfu wybierz długą, unikalną frazę, a konto menedżera zabezpiecz dodatkową metodą logowania. Nie trzymaj list haseł w niezabezpieczonych notatkach ani na zdjęciach. Najpierw popraw bezpieczeństwo poczty i banku, a następnie stopniowo zmieniaj powtórzone hasła w kolejnych usługach."
        ],
        [
          "Wybieraj metody logowania odporne na wyłudzenie",
          "Jeśli usługa pozwala, na ważnych kontach włącz klucz dostępu passkey lub sprzętowy klucz bezpieczeństwa FIDO2. Te rozwiązania są powiązane z prawdziwą domeną, co utrudnia oszustowi przechwycenie danych na fałszywej stronie logowania. Kod z aplikacji uwierzytelniającej też zwiększa bezpieczeństwo, ale nadal można go wyłudzić. SMS może zawieść choćby po przejęciu numeru telefonu. Po dodaniu klucza dostępu sprawdź, czy w ustawieniach nie pozostawiono starszej, słabszej możliwości logowania."
        ],
        [
          "Zadbaj o odzyskanie dostępu przed zgubieniem telefonu",
          "Upewnij się, że zapasowy adres i numer telefonu naprawdę należą do ciebie. Jednorazowe kody odzyskiwania przechowuj w bezpiecznym miejscu, oddzielonym od urządzenia, które może się zepsuć lub zaginąć. Jeśli korzystasz z klucza sprzętowego, rozważ zarejestrowanie zapasowego egzemplarza. Zapoznaj się z oficjalną procedurą odzyskiwania konta, ale nie usuwaj jednocześnie wszystkich działających metod logowania. Nikomu nie podawaj kodów zapasowych, nawet osobie podszywającej się pod pracownika pomocy technicznej."
        ],
        [
          "Regularnie przeglądaj sesje, uprawnienia i aktualizacje",
          "W historii zabezpieczeń sprawdź ostatnie logowania oraz aplikacje, którym przyznano dostęp do danych. Cofnij niepotrzebne uprawnienia, aktualizuj system i przeglądarkę oraz blokuj ekran urządzenia. Wiadomości grożące natychmiastową utratą konta traktuj jako potencjalną próbę oszustwa; wejdź na stronę samodzielnie, bez klikania w przesłany odnośnik. Gdy podejrzewasz przejęcie konta, przeprowadź oficjalne odzyskiwanie na zaufanym urządzeniu i zakończ nieautoryzowane sesje."
        ]
      ]
    }
  }
};
