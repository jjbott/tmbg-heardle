const idOffset = 266;
const potentialAnswers = [
    {
        answer: "(She Was A) Hotel Detective - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/she-was-a-hotel-detective-2"
    },
    { answer: "2082 - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/2082-1" },
    {
        answer: "32 Footsteps - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/32-footsteps-1"
    },
    {
        answer: "9 Secret Steps - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/9-secret-steps-1"
    },
    {
        answer: "A Self Called Nowhere - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/a-self-called-nowhere"
    },
    { answer: "Aaa - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/aaa" },
    {
        answer: "Absolutely Bill's Mood - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/absolutely-bills-mood-1"
    },
    { answer: "AKA Driver - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/aka-driver" },
    {
        answer: "Alienation's for the Rich - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/alienations-for-the-rich-1"
    },
    {
        answer: "All the Lazy Boyfriends - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/all-the-lazy-boyfriends"
    },
    {
        answer: "All Time What - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/all-time-what"
    },
    {
        answer: "Alphabet Lost and Found - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/alphabet-lost-and-found"
    },
    {
        answer: "Alphabet of Nations - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/alphabet-of-nations"
    },
    { answer: "Am I Awake? - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/am-i-awake-2" },
    {
        answer: "An Insult to the Fact Checkers - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/an-insult-to-the-fact-checkers"
    },
    { answer: "Ana Ng - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/ana-ng-3" },
    {
        answer: "And Mom and Kid - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/and-mom-and-kid-1"
    },
    {
        answer: "Another First Kiss - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/another-first-kiss-1"
    },
    { answer: "Answer - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/answer" },
    { answer: "Ant - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/ant" },
    {
        answer: "Apartment Four - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/apartment-four"
    },
    { answer: "Apophenia - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/apophenia" },
    {
        answer: "Au Contraire - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/au-contraire-1"
    },
    { answer: "Bangs - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/bangs-1" },
    {
        answer: "Bastard Wants to Hit Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/bastard-wants-to-hit-me"
    },
    {
        answer: "Become a Robot - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/become-a-robot"
    },
    { answer: "Bed Bed Bed - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/bed-bed-bed" },
    {
        answer: "Bee of the Bird of the Moth - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/bee-of-the-bird-of-the-moth"
    },
    {
        answer: "Bills, Bills, Bills - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/bills-bills-bills"
    },
    {
        answer: "Birdhouse in Your Soul - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/birdhouse-in-your-soul-1"
    },
    { answer: "Birds Fly - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/birds-fly-1" },
    { answer: "Black Ops - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/black-ops-1" },
    {
        answer: "Black Ops Alt - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/black-ops-alt"
    },
    { answer: "Boat of Car - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/boat-of-car-1" },
    { answer: "Boss of Me - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/boss-of-me" },
    {
        answer: "Brain Problem Situation - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/brain-problem-situation-1"
    },
    { answer: "Broke in Two - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/broke-in-two" },
    { answer: "Brontosaurus - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/brontosaurus" },
    {
        answer: "By The Time You Get This - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this-note"
    },
    {
        answer: "C Is for Conifers - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/c-is-for-conifers"
    },
    {
        answer: "Cage & Aquarium - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/cage-aquarium-1"
    },
    {
        answer: "Call You Mom - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/call-you-mom-2"
    },
    {
        answer: "Can You Find It? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/can-you-find-it"
    },
    {
        answer: "Can't Keep Johnny Down - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/cant-keep-johnny-down-2"
    },
    {
        answer: "Canada Haunts Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/canada-haunts-me"
    },
    { answer: "Canajoharie - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/canajoharie" },
    {
        answer: "Careful What You Pack - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/careful-what-you-pack-2"
    },
    { answer: "Caroline, No - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/caroline-no" },
    { answer: "Celebration - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/celebration-1" },
    { answer: "Cells - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/cells" },
    {
        answer: "Certain People I Could Name - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/certain-people-i-could-name"
    },
    {
        answer: "Chess Piece Face - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/chess-piece-face-1"
    },
    {
        answer: "Circular Karate Chop - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/circular-karate-chop-1"
    },
    {
        answer: "Clap Your Hands - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/clap-your-hands-2"
    },
    {
        answer: "Climbing the Walls - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/climbing-the-walls"
    },
    { answer: "Cloissonné - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/cloissone" },
    {
        answer: "Computer Assisted Design - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/computer-assisted-design"
    },
    { answer: "Contrecoup - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/contrecoup" },
    {
        answer: "Counterfeit Faker - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/counterfeit-faker"
    },
    { answer: "Cowtown - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/cowtown-1" },
    {
        answer: "Cyclops Rock - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/cyclops-rock-1"
    },
    { answer: "D & W - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/d-w" },
    {
        answer: "D Is for Drums - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/d-is-for-drums"
    },
    {
        answer: "Damn Good Times - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/damn-good-times-1"
    },
    {
        answer: "Dark and Metric - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/dark-and-metric"
    },
    {
        answer: "Darling, The Dose - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/darling-the-dose"
    },
    { answer: "Daylight - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/daylight" },
    { answer: "Dead - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/dead" },
    {
        answer: "Decision Makers - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/decision-makers-1"
    },
    {
        answer: "Definition of Good - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/definition-of-good-1"
    },
    {
        answer: "Destination Moon - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/destination-moon"
    },
    {
        answer: "Destroy the Past - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/destroy-the-past-1"
    },
    {
        answer: "Didn't Kill Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/didnt-kill-me-1"
    },
    { answer: "Dig My Grave - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/dig-my-grave" },
    { answer: "Dinner Bell - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/dinner-bell" },
    { answer: "Dirt Bike - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/dirt-bike" },
    { answer: "Dog Walker - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/dog-walker" },
    {
        answer: "Don't Let's Start - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/dont-lets-start-2"
    },
    { answer: "Drink! - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/drink-2" },
    { answer: "Drinkin' - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/drinkin" },
    {
        answer: "Drown the Clown - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/drown-the-clown"
    },
    {
        answer: "E Eats Everything - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/e-eats-everything"
    },
    { answer: "ECNALUBMA - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/ecnalubma" },
    {
        answer: "Eight Hundred and Thirteen Mile Car Trip - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/eight-hundred-and-thirteen"
    },
    { answer: "Electric Car - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/electric-car" },
    {
        answer: "Elephants (feat. Danny Weinkauf) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/elephants-feat-danny"
    },
    {
        answer: "Empty Bottle Collector - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/empty-bottle-collector"
    },
    {
        answer: "End of the Rope - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/end-of-the-rope"
    },
    { answer: "Erase - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/erase-1" },
    { answer: "Even Numbers - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/even-numbers" },
    {
        answer: "Everything Right Is Wrong Again - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/everything-right-is-wrong-1"
    },
    {
        answer: "Experimental Film - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/experimental-film-1"
    },
    {
        answer: "Exquisite Dead Guy - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/exquisite-dead-guy"
    },
    {
        answer: "Extra Savoir Faire - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/extra-savoir-faire"
    },
    { answer: "Fake-Believe - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/fake-believe" },
    {
        answer: "Feast of Lights - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/feast-of-lights-1"
    },
    {
        answer: "Feign Amnesia - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/feign-amnesia"
    },
    {
        answer: "Fibber Island - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/fibber-island"
    },
    { answer: "Figure Eight - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/figure-eight" },
    {
        answer: "Fingertips - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/fingertips-combined"
    },
    {
        answer: "Finished with Lies - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/finished-with-lies-1"
    },
    { answer: "Flying V - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/flying-v" },
    { answer: "For Science - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/for-science-1" },
    { answer: "Four of Two - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/four-of-two" },
    { answer: "Fun Assassin - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/fun-assassin" },
    { answer: "Glean - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/glean" },
    { answer: "Go for G! - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/go-for-g" },
    {
        answer: "Good to Be Alive - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/good-to-be-alive"
    },
    {
        answer: "Goodnight My Friends - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/goodnight-my-friends"
    },
    {
        answer: "Got Getting up so Down - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/got-getting-up-so-down"
    },
    { answer: "Great - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/great-1" },
    {
        answer: "Hall of Heads - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hall-of-heads"
    },
    {
        answer: "Hate the Villanelle - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hate-the-villanelle"
    },
    { answer: "Hearing Aid - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/hearing-aid" },
    {
        answer: "Heart Of The Band - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/heart-of-the-band"
    },
    {
        answer: "Hello Mrs. Wheelyke - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hello-mrs-wheelyke-1"
    },
    { answer: "Hello Radio - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/hello-radio-1" },
    {
        answer: "Here Comes Science - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/here-comes-science"
    },
    {
        answer: "Here in Higglytown (Theme to Playhouse Disney's Higglytown Heroes) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/higglytown-heroes-theme-album"
    },
    {
        answer: "Hey, Mr. DJ, I Thought You Said We Had a Deal - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hey-mr-dj-i-thought-you-said-1"
    },
    {
        answer: "Hide Away Folk Family - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hide-away-folk-family-1"
    },
    { answer: "High Five! - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/high-five" },
    { answer: "Hive Mind - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/hive-mind-1" },
    {
        answer: "Hopeless Bleak Despair - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hopeless-bleak-dispair"
    },
    { answer: "Hot Cha - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/hot-cha" },
    { answer: "Hot Dog! - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/hot-dog" },
    {
        answer: "Hovering Sombrero - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hovering-sombrero-1"
    },
    {
        answer: "How Can I Sing Like a Girl? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/how-can-i-sing-like-a-girl-1"
    },
    {
        answer: "How Many Planets? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/how-many-planets"
    },
    {
        answer: "Hypnotist of Ladies - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/hypnotist-of-ladies"
    },
    {
        answer: "I Am a Grocery Bag - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-am-a-grocery-bag"
    },
    {
        answer: "I Am a Human Head - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-am-a-human-head"
    },
    {
        answer: "I Am a Paleontologist - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-am-a-paleontologist"
    },
    { answer: "I Am Alone - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/i-am-alone" },
    {
        answer: "I Am Invisible - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-am-invisible-1"
    },
    {
        answer: "I Am Not Your Broom - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-am-not-your-broom"
    },
    {
        answer: "I Broke My Own Rule - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-broke-my-own-rule"
    },
    { answer: "I C U - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/i-c-u" },
    { answer: "I Can Add - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/i-can-add" },
    {
        answer: "I Can Hear You - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-can-hear-you"
    },
    {
        answer: "I Can Help the Next in Line - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-can-help-the-next-in-line"
    },
    {
        answer: "I Can't Hide from My Mind - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-cant-hide-from-my-mind"
    },
    {
        answer: "I Can't Remember the Dream - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-cant-remember-the-dream"
    },
    {
        answer: "I Haven't Seen You in Forever - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-havent-seen-you-in-forever-1"
    },
    {
        answer: "I Hope That I Get Old Before I Die - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-hope-that-i-get-old-before-1"
    },
    {
        answer: "I Just Want to Dance - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-just-want-to-dance-1"
    },
    {
        answer: "I Left My Body - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-left-my-body"
    },
    { answer: "I Like Fun - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/i-like-fun" },
    {
        answer: "I Lost Thursday - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-lost-thursday"
    },
    {
        answer: "I Love You for Psychological Reasons - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-love-you-for-psychological"
    },
    {
        answer: "I Made a Mess - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-made-a-mess-1"
    },
    {
        answer: "I Palindrome I - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-palindrome-i"
    },
    {
        answer: "I Should Be Allowed to Think - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-should-be-allowed-to-think"
    },
    {
        answer: "I Wasn't Listening - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/i-wasnt-listening"
    },
    {
        answer: "I'll Be Haunting You - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/ill-be-haunting-you"
    },
    {
        answer: "I'll Sink Manhattan - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/ill-sink-manhattan-1"
    },
    { answer: "I'm a Coward - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/im-a-coward" },
    {
        answer: "I'm All That You Can Think Of - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/im-all-that-you-can-think-of"
    },
    {
        answer: "I'm Gettin' Sentimental over You (Adaptation) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/im-gettin-sentimental-over-you"
    },
    {
        answer: "I'm Impressed - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/im-impressed-1"
    },
    {
        answer: "I've Got a Fang - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/ive-got-a-fang-1"
    },
    {
        answer: "I've Got a Match - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/ive-got-a-match-1"
    },
    { answer: "Icky - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/icky-1" },
    {
        answer: "If Day for Winnipeg - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/if-day-for-winnipeg"
    },
    {
        answer: "If I Wasn't Shy - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/if-i-wasnt-shy"
    },
    {
        answer: "Impossibly New - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/impossibly-new"
    },
    { answer: "In Fact - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/in-fact" },
    {
        answer: "In the Middle, In the Middle, In the Middle - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/in-the-middle-in-the-middle-in"
    },
    {
        answer: "Infinity - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/infinity-they-might-be-giants"
    },
    {
        answer: "Insect Hospital - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/insect-hospital-1"
    },
    {
        answer: "Istanbul (Not Constantinople) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/istanbul-not-constantinople-2"
    },
    {
        answer: "It Said Something - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/it-said-something"
    },
    {
        answer: "It's Kickin' In - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/its-kickin-in"
    },
    {
        answer: "It's Not My Birthday - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/its-not-my-birthday-1"
    },
    { answer: "James K. Polk - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/james-k-polk" },
    { answer: "Jessica - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/jessica" },
    {
        answer: "John Lee Supertaster - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/john-lee-supertaster"
    },
    {
        answer: "Judy Is Your Viet Nam - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/judy-is-your-viet-nam-1"
    },
    {
        answer: "Kiss Me, Son of God - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/kiss-me-son-of-god-1"
    },
    {
        answer: "Kiss Me, Son of God - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/kiss-me-sun-of-god-alternate"
    },
    { answer: "L M N O - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/l-m-n-o" },
    {
        answer: "Lady Is a Tramp - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lady-is-a-tramp-1"
    },
    {
        answer: "Lake Monsters - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lake-monsters"
    },
    { answer: "Last Wave - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/last-wave" },
    {
        answer: "Lazyhead and Sleepbones - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lazyhead-and-sleepbones"
    },
    {
        answer: "Less Than One - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/less-than-one"
    },
    {
        answer: "Let Me Tell You About My Operation - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/let-me-tell-you-about-my"
    },
    {
        answer: "Let Your Hair Hang Down - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/let-your-hair-hang-down"
    },
    {
        answer: "Let's Get This Over With - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lets-get-this-over-with"
    },
    {
        answer: "Letter /  Not a Letter - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/letter-not-a-letter"
    },
    {
        answer: "Letter Shapes - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/letter-shapes"
    },
    { answer: "Letterbox - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/letterbox" },
    {
        answer: "Lie Still, Little Bottle - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lie-still-little-bottle-1"
    },
    {
        answer: "Long White Beard (feat. Robin Goldwasser) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/long-white-beard-feat-robin"
    },
    { answer: "Lord Snowdon - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/lord-snowden" },
    {
        answer: "Lost My Mind - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lost-my-mind-2"
    },
    {
        answer: "Lucky Ball and Chain - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lucky-ball-and-chain"
    },
    {
        answer: "Lullaby to Nightmares - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/lullaby-to-nightmares"
    },
    { answer: "MacGyver - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/macgyver" },
    {
        answer: "Madam, I Challenge You to a Duel - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/madam-i-challenge-you-to-a-1"
    },
    { answer: "Mammal - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/mammal" },
    {
        answer: "Man, It's So Loud in Here - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/man-its-so-loud-in-here-1"
    },
    { answer: "Maybe I Know - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/maybe-i-know" },
    {
        answer: "McCafferty's Bib - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/mccaffertys-bib"
    },
    {
        answer: "Meet James Ensor - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/meet-james-ensor-1"
    },
    {
        answer: "Meet the Elements - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/meet-the-elements"
    },
    {
        answer: "Memo to Human Resources - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/memo-to-human-resources"
    },
    {
        answer: "Metal Detector - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/metal-detector"
    },
    {
        answer: "Mickey Mouse Clubhouse Theme - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/mickey-mouse-clubhouse"
    },
    { answer: "Minimum Wage - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/minimum-wage" },
    { answer: "Mink Car - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/mink-car-1" },
    {
        answer: "Moles, Hounds, Bears, Bees and Hares - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/moles-hounds-bears-bees-and"
    },
    {
        answer: "Moonbeam Rays - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/moonbeam-rays"
    },
    { answer: "Mr. Klaw - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/mr-klaw-1" },
    { answer: "Mr. Me - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/mr-me-1" },
    {
        answer: "Mr. Xcitement - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/mr-xcitement-1"
    },
    {
        answer: "Mrs. Bluebeard - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/mrs-bluebeard"
    },
    {
        answer: "Museum of Idiots - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/museum-of-idiots"
    },
    {
        answer: "Music Jail, Pt. 1 & 2 - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/music-jail-pt-1-2"
    },
    {
        answer: "My Brother the Ape - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/my-brother-the-ape"
    },
    { answer: "My Evil Twin - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/my-evil-twin" },
    { answer: "My Man - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/my-man-1" },
    { answer: "Nanobots - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/nanobots-2" },
    {
        answer: "Narrow Your Eyes - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/narrow-your-eyes"
    },
    {
        answer: "Never Knew Love - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/never-knew-love"
    },
    {
        answer: "New York City - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/new-york-city"
    },
    {
        answer: "Nightgown of the Sullen Moon - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/nightgown-of-the-sullen-moon-1"
    },
    {
        answer: "Nine Bowls of Soup - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/nine-bowls-of-soup"
    },
    {
        answer: "No One Knows My Plan - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/no-one-knows-my-plan"
    },
    { answer: "No! - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/no" },
    { answer: "Nonagon - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/nonagon" },
    {
        answer: "Nothing's Gonna Change My Clothes - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/nothings-gonna-change-my-1"
    },
    { answer: "Nouns - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/nouns-1" },
    {
        answer: "Now Is Strange - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/now-is-strange"
    },
    {
        answer: "Now That I Have Everything - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/now-that-i-have-everything"
    },
    {
        answer: "Number Three - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/number-three-1"
    },
    { answer: "Number Two - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/number-two" },
    {
        answer: "O Do Not Forsake Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/o-do-not-forsake-me"
    },
    {
        answer: "O Tannenbaum - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/o-tannenbaum-1"
    },
    {
        answer: "Oh You Did (feat. Robin Goldwasser) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/oh-you-did-feat-robin"
    },
    { answer: "Old Pine Box - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/old-pine-box" },
    { answer: "Older - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/older-2" },
    { answer: "Omnicorn - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/omnicorn-1" },
    {
        answer: "On Earth My Nina - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/on-earth-my-nina"
    },
    { answer: "On the Drag - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/on-the-drag" },
    {
        answer: "One Dozen Monkeys - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/one-dozen-monkeys"
    },
    {
        answer: "One Everything - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/one-everything"
    },
    {
        answer: "Ooh La! Ooh La! - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/ooh-la-ooh-la"
    },
    {
        answer: "Operators Are Standing By - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/operators-are-standing-by"
    },
    {
        answer: "Or so I Have Read - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/or-so-i-have-read-1"
    },
    {
        answer: "Other Father Song - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/other-father-song"
    },
    {
        answer: "Out of a Tree - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/out-of-a-tree-1"
    },
    { answer: "Out of Jail - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/out-of-jail" },
    {
        answer: "Part of You Wants to Believe Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/part-of-you-wants-to-believe"
    },
    {
        answer: "Particle Man - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/particle-man-1"
    },
    { answer: "Pencil Rain - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/pencil-rain-1" },
    { answer: "Pet Name - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/pet-name" },
    {
        answer: "Photosynthesis - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/photosynthesis"
    },
    {
        answer: "Pictures of Pandas Painting - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/pictures-of-pandas-painting"
    },
    {
        answer: "Piece of Dirt - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/piece-of-dirt-1"
    },
    {
        answer: "Pirate Girls Nine - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/pirate-girls-nine"
    },
    { answer: "Prevenge - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/prevenge" },
    { answer: "Protagonist - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/protagonist" },
    {
        answer: "Purple Toupee - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/purple-toupee-1"
    },
    {
        answer: "Push Back the Hands - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/push-back-the-hands"
    },
    {
        answer: "Put It to the Test - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/put-it-to-the-test"
    },
    {
        answer: "Put Your Hand Inside the Puppet Head - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/put-your-hand-inside-the-1"
    },
    { answer: "Q U - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/q-u-album-version" },
    {
        answer: "Quit the Circus - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/quit-the-circus"
    },
    { answer: "Rabid Child - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/rabid-child-1" },
    { answer: "Rat Patrol - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/rat-patrol" },
    { answer: "Replicant - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/replicant-1" },
    {
        answer: "Reprehensible - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/reprehensible"
    },
    { answer: "Rest Awhile - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/rest-awhile" },
    {
        answer: "Rhythm Section Want Ad - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/rhythm-section-want-ad-1"
    },
    {
        answer: "Road Movie to Berlin - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/road-movie-to-berlin"
    },
    { answer: "Robot Parade - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/robot-parade" },
    {
        answer: "Robot Parade (Adult Version) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/robot-parade-adult-version"
    },
    { answer: "Rolling O - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/rolling-o" },
    { answer: "Roy G. Biv - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/roy-g-biv" },
    { answer: "S-E-X-X-Y - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/s-e-x-x-y-1" },
    { answer: "Santa Claus - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/santa-claus-1" },
    {
        answer: "Santa's Beard - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/santas-beard-4"
    },
    {
        answer: "Sapphire Bullets of Pure Love - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/sapphire-bullets-of-pure-love"
    },
    {
        answer: "Say Nice Things About Detroit - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/say-nice-things-about-detroit"
    },
    {
        answer: "Science Is Real - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/science-is-real"
    },
    {
        answer: "See the Constellation - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/see-the-constellation"
    },
    { answer: "Seven - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/seven" },
    {
        answer: "Seven Days Of The Week (I Never Go To Work) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/seven-days-of-the-week-i-never"
    },
    {
        answer: "Shape Shifter - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/shape-shifter"
    },
    {
        answer: "She Thinks She's Edith Head - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/she-thinks-shes-edith-head-2"
    },
    {
        answer: "She's Actual Size - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/shes-actual-size-1"
    },
    {
        answer: "She's an Angel - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/shes-an-angel-2"
    },
    {
        answer: "Shoehorn with Teeth - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/shoehorn-with-teeth-1"
    },
    { answer: "Skullivan - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/skullivan" },
    { answer: "Sleep - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/sleep-1" },
    {
        answer: "Sleeping in the Flowers - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/sleeping-in-the-flowers-1"
    },
    { answer: "Sleepwalkers - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/sleepwalkers" },
    { answer: "Snail Shell - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/snail-shell" },
    {
        answer: "Snowball in Hell - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/snowball-in-hell-1"
    },
    {
        answer: "So Crazy for Books - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/so-crazy-for-books-1"
    },
    {
        answer: "Sold My Mind to the Kremlin - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/sold-my-mind-to-the-kremlin"
    },
    {
        answer: "Solid Liquid Gas - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/solid-liquid-gas"
    },
    {
        answer: "Someone Keeps Moving My Chair - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/someone-keeps-moving-my-chair"
    },
    {
        answer: "Sometimes a Lonely Way - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/sometimes-a-lonely-way-1"
    },
    { answer: "Space Suit - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/space-suit" },
    {
        answer: "Speed and Velocity - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/speed-and-velocity"
    },
    { answer: "Spider - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/spider-1" },
    { answer: "Spine - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/spine" },
    { answer: "Spines - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/spines" },
    {
        answer: "Spiraling Shape - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/spiraling-shape"
    },
    {
        answer: "Spoiler Alert - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/spoiler-alert"
    },
    { answer: "Spy - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/spy-1" },
    {
        answer: "Spy - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/spy-unreleased-live-version"
    },
    {
        answer: "Stalk of Wheat - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/stalk-of-wheat"
    },
    {
        answer: "Stand on Your Own Head - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/stand-on-your-head"
    },
    { answer: "Stomp Box - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/stomp-box" },
    {
        answer: "Stone Cold Coup D'etat - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/stone-cold-coup-detat-1"
    },
    {
        answer: "Stuff Is Way - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/stuff-is-way-1"
    },
    { answer: "Subliminal - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/subliminal" },
    { answer: "Super Cool - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/super-cool" },
    {
        answer: "Synopsis for Latecomers - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/synopsis-for-latecomers"
    },
    {
        answer: "Take out the Trash - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/take-out-the-trash"
    },
    {
        answer: "Ten Mississippi - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/ten-mississippi"
    },
    { answer: "Tesla - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/tesla-2" },
    {
        answer: "The Ballad of Davy Crockett (in Outer Space) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-ballad-of-davy-crockett-in"
    },
    {
        answer: "The Bells Are Ringing - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-bells-are-ringing"
    },
    {
        answer: "The Biggest One - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-biggest-one-1"
    },
    {
        answer: "The Bloodmobile - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-bloodmobile"
    },
    {
        answer: "The Bright Side - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-bright-side"
    },
    { answer: "The Cap'm - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/the-capm" },
    {
        answer: "The Darlings of Lumberland - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-darlings-of-lumberland-2"
    },
    { answer: "The Day - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/the-day-1" },
    {
        answer: "The Edison Museum - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-edison-museum-1"
    },
    {
        answer: "The End of the Tour - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-end-of-the-tour"
    },
    {
        answer: "The Famous Polka - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-famous-polka-1"
    },
    { answer: "The Greatest - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/the-greatest" },
    { answer: "The Guitar - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/the-guitar" },
    {
        answer: "The House at the Top of the Tree - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-house-at-the-top-of-the"
    },
    {
        answer: "The Lady and the Tiger - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-lady-and-the-tiger-1"
    },
    {
        answer: "The Mesopotamians - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-mesopotamians-2"
    },
    {
        answer: "The Other Side of the World - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-other-side-of-the-world"
    },
    {
        answer: "The Secret Life Of Six - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-secret-life-of-six"
    },
    {
        answer: "The Shadow Government - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-shadow-government"
    },
    {
        answer: "The Spine Surfs Alone - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-spine-surfs-alone"
    },
    {
        answer: "The Statue Got Me High - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-statue-got-me-high"
    },
    {
        answer: "The Vowel Family - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-vowel-family"
    },
    {
        answer: "The World Before Later On - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-world-before-later-on"
    },
    {
        answer: "The World's Address - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-worlds-address-1"
    },
    {
        answer: "The World's Address (Joshua Fried Remix) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/the-worlds-address-joshua-1"
    },
    {
        answer: "Theme from Flood - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/theme-from-flood"
    },
    {
        answer: "Then the Kids Took Over - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/then-the-kids-took-over-1"
    },
    { answer: "There - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/there-1" },
    { answer: "Thermostat - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/thermostat" },
    {
        answer: "They Got Lost - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/they-got-lost"
    },
    {
        answer: "They Might Be Giants - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/they-might-be-giants"
    },
    {
        answer: "They'll Need a Crane - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/theyll-need-a-crane-1"
    },
    {
        answer: "Thinking Machine - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/thinking-machine-1"
    },
    {
        answer: "This Microphone - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/this-microphone"
    },
    {
        answer: "Three Might Be Duende - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/three-might-be-duende"
    },
    { answer: "Thunderbird - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/thunderbird" },
    { answer: "Tick - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/tick-1" },
    {
        answer: "Till My Head Falls Off - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/till-my-head-falls-off-1"
    },
    { answer: "To a Forest - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/to-a-forest" },
    {
        answer: "Toddler Hiway - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/toddler-hiway-1"
    },
    {
        answer: "Token Back to Brooklyn - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/token-back-to-brooklyn"
    },
    {
        answer: "Too Tall Girl - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/too-tall-girl-1"
    },
    {
        answer: "Triops Has Three Eyes - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/triops-has-three-eyes"
    },
    {
        answer: "Trouble Awful Devil Evil - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/trouble-awful-devil-evil-1"
    },
    {
        answer: "Tubthumping (feat. The Onion Av Club Choir) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/tubthumping-feat-the-onion-av"
    },
    { answer: "Turn Around - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/turn-around" },
    { answer: "Twisting - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/twisting" },
    {
        answer: "Underwater Woman - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/underwater-woman"
    },
    {
        answer: "Unpronounceable - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/unpronounceable"
    },
    {
        answer: "Unrelated Thing - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/unrelated-thing"
    },
    {
        answer: "Upside Down Frown - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/upside-down-frown"
    },
    { answer: "Violin - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/violin" },
    {
        answer: "Wait Actually Yeah No - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/wait-actually-yeah-no"
    },
    { answer: "Wake up Call - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/wake-up-call" },
    {
        answer: "Walking My Cat Named Dog - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/walking-my-cat-named-dog-1"
    },
    {
        answer: "We Live in a Dump - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/we-live-in-a-dump-2"
    },
    {
        answer: "We Want a Rock - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/we-want-a-rock"
    },
    {
        answer: "We're the Replacements - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/were-the-replacements-1"
    },
    {
        answer: "Wearing a Raincoat - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/wearing-a-raincoat"
    },
    { answer: "Weep Day - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/weep-day" },
    {
        answer: "What Did I Do to You? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/what-did-i-do-to-you"
    },
    {
        answer: "What Is a Shooting Star? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/what-is-a-shooting-star"
    },
    {
        answer: "When It Rains It Snows - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/when-it-rains-it-snows-1"
    },
    {
        answer: "When the Lights Come On - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/when-the-lights-come-on"
    },
    {
        answer: "When Will You Die? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/when-will-you-die-1"
    },
    {
        answer: "Where Do They Make Balloons? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/where-do-they-make-balloons"
    },
    {
        answer: "Where Your Eyes Don't Go - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/where-your-eyes-dont-go-1"
    },
    {
        answer: "Which Describes How You're Feeling - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/which-describes-how-youre-1"
    },
    { answer: "Whirlpool - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/whirlpool" },
    {
        answer: "Whistling in the Dark - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/whistling-in-the-dark"
    },
    {
        answer: "Who Put the Alphabet in Alphabetical Order? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/who-put-the-alphabet-in"
    },
    {
        answer: "Why Does the Sun Really Shine? (The Sun Is a Miasma of Incandescent Plasma) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/why-does-the-sun-really-shine"
    },
    {
        answer: "Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine"
    },
    {
        answer: "Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas) - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1"
    },
    {
        answer: "Why Must I Be Sad? - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/why-must-i-be-sad"
    },
    {
        answer: "Wicked Little Critta - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/wicked-little-critta-1"
    },
    { answer: "Window - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/window" },
    {
        answer: "With the Dark - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/with-the-dark"
    },
    {
        answer: "Withered Hope - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/withered-hope-1"
    },
    { answer: "Women & Men - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/women-men" },
    {
        answer: "Working Undercover for the Man - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/working-undercover-for-the-1"
    },
    {
        answer: "XTC vs. Adam Ant - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/xtc-vs-adam-ant-1"
    },
    { answer: "Yeh Yeh - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/yeh-yeh-1" },
    {
        answer: "You Don't Like Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/you-dont-like-me"
    },
    {
        answer: "You Probably Get That a Lot - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/you-probably-get-that-a-lot"
    },
    {
        answer: "You'll Miss Me - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/youll-miss-me-1"
    },
    {
        answer: "You're on Fire - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/youre-on-fire-3"
    },
    {
        answer: "Your Mom's Alright - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/your-moms-alright"
    },
    {
        answer: "Your Own Worst Enemy - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/your-own-worst-enemy"
    },
    {
        answer: "Your Racist Friend - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/your-racist-friend"
    },
    {
        answer: "Youth Culture Killed My Dog - They Might Be Giants",
        url: "https://soundcloud.com/they-might-be-giants/youth-culture-killed-my-dog-1"
    },
    { answer: "Z Y X - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/z-y-x" },
    { answer: "Zeroes - They Might Be Giants", url: "https://soundcloud.com/they-might-be-giants/zeroes" }
];
const answerIndexes = [
    226, 196, 169, 238, 95, 35, 181, 9, 234, 248, 46, 171, 267, 369, 307, 304, 336, 273, 87, 217, 40, 298, 387, 78, 325,
    243, 57, 41, 182, 165, 185, 292, 178, 99, 350, 326, 112, 175, 130, 76, 154, 222, 332, 264, 47, 334, 15, 244, 372,
    208, 277, 187, 377, 202, 289, 206, 353, 299, 96, 155, 131, 249, 71, 320, 398, 216, 337, 92, 156, 301, 389, 51, 180,
    170, 30, 19, 17, 14, 37, 200, 172, 18, 380, 374, 2, 257, 116, 158, 157, 414, 129, 146, 356, 363, 65, 107, 342, 313,
    335, 344, 72, 0, 381, 152, 73, 27, 268, 365, 13, 140, 141, 385, 195, 135, 312, 405, 44, 392, 147, 113, 343, 308, 21,
    262, 186, 173, 59, 90, 62, 252, 223, 162, 127, 384, 407, 105, 188, 45, 120, 149, 396, 213, 404, 270, 366, 383, 123,
    194, 164, 86, 139, 204, 168, 368, 197, 240, 393, 415, 411, 161, 261, 413, 283, 382, 39, 75, 100, 253, 373, 82, 166,
    305, 331, 315, 58, 211, 38, 330, 228, 221, 80, 66, 408, 24, 29, 233, 323, 10, 231, 286, 354, 218, 23, 401, 25, 303,
    28, 265, 321, 232, 54, 79, 310, 5, 91, 412, 348, 370, 179, 124, 31, 115, 364, 183, 256, 64, 136, 400, 1, 340, 327,
    294, 318, 137, 291, 410, 334, 199, 272, 191, 165, 76, 336, 304, 375, 33, 214, 34, 406, 219, 50, 349, 93, 22, 88,
    352, 358, 377, 299, 99, 227, 159, 207, 353, 289, 60, 248, 398, 52, 8, 224, 200, 69, 206, 174, 391, 290, 371, 4, 32,
    403, 37, 177, 131, 12, 102, 77, 158, 192, 345, 324, 7, 347, 133, 78, 341, 185, 245, 47, 202, 250, 2, 322, 264, 156,
    275, 110, 15, 36, 357, 109, 273, 148, 57, 262, 316, 388, 380, 372, 104, 189, 362, 40, 243, 332, 405, 402, 146, 301,
    113, 74, 26, 92, 112, 252, 41, 51, 163, 335, 255, 175, 21, 170, 20, 126, 157, 280, 308, 295, 244, 337, 144, 155,
    374, 85, 45, 384, 282, 147, 198, 271, 270, 320, 30, 6, 363, 376, 9, 129, 356, 75, 225, 195, 212, 116, 63, 369, 394,
    281, 344, 106, 10, 178, 201, 330, 46, 154, 228, 29, 360, 169, 166, 386, 13, 286, 105, 142, 96, 213, 284, 401, 381,
    269, 16, 172, 389, 19, 65, 232, 413, 38, 312, 209, 27, 220, 315, 62, 359, 35, 119, 277, 218, 68, 314, 124, 319, 111,
    49, 233, 263, 194, 179, 373, 100, 0, 182, 3, 55, 130, 307, 22, 237, 340, 406, 107, 25, 377, 181, 299, 196, 329, 411,
    187, 58, 400, 291, 11, 91, 327, 298, 283, 343, 90, 311, 259, 183, 365, 412, 206, 304, 323, 70, 153, 44, 67, 136,
    387, 231, 86, 210, 375, 398, 370, 32, 135, 202, 162, 358, 93, 382, 221, 33, 159, 408, 391, 94, 371, 207, 18, 399,
    148, 173, 149, 272, 54, 410, 236, 78, 347, 324, 388, 256, 199, 334, 158, 99, 354, 254, 407, 379, 255, 393, 321, 385,
    177, 140, 47, 403, 131, 64, 333, 122, 305, 155, 309, 7, 336, 355, 34, 120, 224, 57, 79, 108, 164, 368, 261, 4, 335,
    192, 274, 215, 147, 48, 121, 175, 72, 197, 74, 316, 344, 116, 198, 266, 88, 285, 268, 362, 271, 15, 360, 157, 234,
    303, 349, 171, 339, 105, 160, 14, 353, 345, 167, 174, 110, 80, 322, 292, 369, 40, 17, 43, 24, 242, 248, 73, 163,
    381, 318, 30, 59, 264, 384, 126, 227, 156, 225, 253, 243, 19, 363, 195, 233, 313, 124, 6, 416, 166, 27, 212, 204,
    326, 216, 366, 102, 286, 263, 294, 82, 279, 35, 113, 359, 314, 52, 50, 290, 252, 51, 10, 150, 307, 96, 161, 350, 1,
    320, 244, 201, 41, 182, 181, 141, 53, 144, 330, 299, 409, 170, 365, 413, 133, 232, 312, 260, 107, 250, 2, 337, 262,
    191, 217, 60, 71, 259, 159, 25, 397, 298, 119, 398, 275, 220, 380, 165, 187, 169, 308, 221, 115, 186, 410, 343, 296,
    202, 104, 280, 414, 329, 76, 390, 91, 162, 387, 65, 78, 269, 207, 47, 214, 32, 94, 199, 129, 38, 58, 185, 55, 295,
    196, 238, 54, 273, 16, 282, 63, 223, 23, 37, 218, 399, 45, 289, 127, 131, 272, 276, 77, 283, 111, 403, 241, 155,
    154, 281, 139, 315, 222, 125, 321, 388, 46, 371, 172, 158, 151, 372, 356, 361, 396, 198, 358, 340, 404, 360, 149,
    174, 408, 140, 305, 332, 344, 34, 192, 322, 338, 385, 75, 317, 64, 200, 67, 92, 213, 146, 9, 13, 405, 12, 375, 24,
    33, 70, 389, 382, 178, 148, 21, 324, 393, 211, 215, 355, 105, 292, 261, 237, 348, 402, 216, 19, 138, 294, 363, 126,
    87, 362, 235, 316, 384, 366, 383, 62, 345, 183, 394, 116, 359, 225, 163, 51, 79, 31, 233, 132, 369, 15, 35, 203, 82,
    303, 290, 86, 309, 122, 367, 310, 253
];

const startDate = "2022-12-22";

export { startDate, idOffset, potentialAnswers, answerIndexes };
