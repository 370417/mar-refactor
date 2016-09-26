# FAQ Friday questions

[1: Languages and Libaries](#1-languages-and-libraries)  
[2: Development Tools](#2-development-tools)  
[3: The Game Loop](#3-the-game-loop)  
[12: Field of Vision](#12-field-of-vision)  
[13: Geometry](#13-geometry)  
[14: Inspiration](#14-inspiration)  
[36: Character Progression](#36-character-progression)  
[45: Lanugages Redux](#45-languages-redux)  

## 1: Languages and Libraries

> What languages and libraries are you using to build your current roguelike? Why did you choose them? How have they been particularly useful, or not so useful?

Many a Rogue is written in Javascript.  
Pros:

* I had prior experience with the language
* Cross-platform and install-free
* Lots of freedom, with dynamic typing, prototypical inheritance, and first-class functions
* Fast development cycle
* I write js es6, the new standard for javascript, and transpile it to es5, the widely-supported standard, using Babel
* Easy UI with HTML/CSS

Cons:

* Client-side, can't prevent cheating
* Lots of freedom, with dynamic typing, prototypical inheritance, and first-class functions
* It takes time (only 5 seconds or so) to transpile my code
* Not as fast as other languages

## 2: Development Tools

> What kind of publicly available tools do you use to develop your roguelike(s)? What for? Have you built any of your own tools? And if so, what do they do?

## 3: The Game Loop

> How do you structure your game loop? Why did you choose that method? Or maybe you're using an existing engine that already handles all this for you under the hood?

## 4: World Architecture

> How do you divide and organize the objects of your game world? Is it as simple as lists of objects? How are related objects handled?

## 5: Data Management

> How do you add content to your roguelike? What form does that content take in terms of data representation? In other words, aside from maps (a separate topic) how do you define and edit specific game objects like mobs, items, and terrain? Why did you choose this particular method?

## 6: Content Creation and Balance

> How do you decide what mobs/items/abilities/terrain/etc to add to your game? In any good roguelike content creation is inseparable from the concept of balance, so your methods of balancing content are certainly within the scope of this discussion.

## 7: Loot

> How do you determine and control loot distribution in your roguelike? Is it completely random? Based purely on depth/level/type? Are there any kinds of guarantees for different characters? How do you make sure the distribution is balanced?

## 8: Core Mechanic

> What is your game's core mechanic? How did you choose it? Did you prototype it first? Has it changed/evolved at all during development?

## 9: Debugging

> How do you approach debugging? How and where do you use error reporting? Do you use in-house tools? Third-party utilities? Good old print() statements? Language-specific solutions?

## 10: Project Management

> How many different pieces is your project composed of? How do you organize them? Are there any specific reasons or benefits for which you chose to handle things the way you do?

## 11: Random Number Generation

> What type of RNG do you use? Is it provided by the language or an external library? Is there anything interesting you do with random numbers? Do you store seeds? Bags of numbers? Use predictable sequences?

## 12: Field of Vision

> What FOV algorithm do you use, and why? Does it have any drawbacks or particularly useful characteristics? Does it have bidirectional symmetry? Is it fast? How did you come up with it?

I use recursive shadowcasting. It's fast, efficient, and elegant. To quickly summarize how the algorithm works, it casts arcs of light at increasing ranges, recursively splitting into smaller arcs when it encounters obstables. I think it's just about a perfect algorithm for rectangular grids, where you can sweep octants, and everything is generally understandable. However, Many a Rogue uses a hex grid, so I use a radial variant that sweeps out arcs instead of lines. Hexagon math is a bit complicated, so I pretend that walls are diamonds that point towards the origin. That means that, unlike the rectangular version, the hex version of recursive shadowcasting lacks bidirectional symmetry.

n.b. The simplest version of recursive shadowcasting does not have bidirectional symmetry. All you need to do to ensure symmetry is to only light tiles whose *centers* lie in the lit area.

## 13: Geometry

> Does it use continuous space? Does it use hexes, squares, or something else? If square, is movement Chebyshev, Euclidean, or Taxicab? Same question for line of sight and effects with limited range.

Many a Rogue uses a hex grid. This works well because the game takes place in caves, and hexes tend to shine when representing natural formations as opposed to artificial structures. Hexes are also very nice because you no longer have to deal with diagonals or any sort of varying movement costs. The challenges of using hexes are that it is less intuitive, and its more difficult to display the grid. Games like Cogmind and Pyromancer subdivide the main grid for particle effects, which is still possible but less symmetric if using hexes. There's also less free assests floating around for hex games, but I talk more about that in the [map object representation](#28-map-object-representation) question.

## 14: Inspiration

> What are sources of inspiration for your project(s)? Movies? Books? History? Other games? Other people? Anything, really...

* My favorite game, a little flash game called Sonny 2
* Two other flash games, Starfighter: Disputed Galaxy and Realm of the Mad God
* The roguelikes I play semi-frequently: Rogue, Brogue, and Sil
* /r/roguelikedev
* More that doesn't come to mind right now

## 15: AI

> What's your approach to AI?

## 16: UI Design

> What do you think are important considerations when designing a UI? How have you applied these to your own project?

## 17: UI implementation

> How do you structure your interface at the program and engine level? Does it conform to a discrete grid? Support both ASCII and tiles? Separate windows? How flexible is the system? How do you handle rendering?

## 18: Input Handling

> How do you process keyboard/mouse/other input? What's your solution for handling different contexts? Is there any limit on how quickly commands can be entered and processed? Are they buffered? Do you support rebinding, and how?

## 19: Permadeath

> Do you implement permadeath? If so, how does the design take it into account? Are there any mechanics which apply across more than one life?

## 20: Saving

> How do you save the game state? When? Is there anything special about the format? Are save files stable between versions? Can players record and replay the entire game? Are multiple save files allowed? Is there anything interesting or different about your save system?

## 21: Morgue Files

> What do you include in your morgue files? (You do have morgue files, right? If not: Why not?) Do you have any unique or interesting representations or applications for the files or perhaps full player ghost data?

## 22: Map Generation

> What types of mapgen algorithms do you use in your roguelike? Are maps fully procedural or do they contain hand-made pieces as well? Have you encountered and/or overcome any obstacles regarding map generation?

## 23: Map Design

> What's your process for designing maps? How do the map layouts reflect your roguelike's mechanics, content, theme, strategies, and other elements? What defines a fun/challenging/thematic/??? map for you/your game?

## 24: World Structure

> What types of areas exist in your roguelike world, and how do they connect to each other?

## 25: Pathfinding

> What types of pathfinding techniques do you use? How do you use them? What kinds of problems have you encountered or solved via pathfinding? (Nothing is too simple!) Specific examples?

## 26: Animation

> Do you use animations to show the results of an attack? Attacks themselves? (Especially those at range.) Movement? Other elements?
Describe your animation system's architecture. How are animations associated with an action? How do you work within the limitations of ASCII/2D grids? Any "clever hacks"?



## 27: Color

> Is color particularly important to your roguelike? What colors do you use, and how? How did you determine your color scheme?

## 28: Map Object Representation

> What categories of objects are visible on the map in your roguelike? How did you choose to represent each? What other considerations have factored into your decisions?

## 29: Fonts and Styles

> What font(s) do you use? Did you create them yourself, or where did you find them? If there's more than one, why is each used for what it is? What format do you use--TTF/bitmap/other? How do you handle different resolutions/window sizes? (Scaling? Expanded view? Multiple bitmaps?)

## 30: Message Logs

> Describe the layout and behavior of your message log. How many and what types of messages are there? How are those messages generated? On what do you base your color scheme, if any? What other factors do you consider when working with your message log? (If your roguelike doesn't have a message log, why not?)

## 31: Pain Points

> "What's the most painful or tricky part in how your game is made up? Did something take a huge amount of effort to get right? Are there areas in the engine where the code is a mess that you dread to even look at? Are there ideas you have that you just haven't gotten to work or haven't figured out how to turn into code? What do you think are the hardest parts in a roguelike codebase to get right, and do you have any implementation tips for them?"

## 32: Combat Algorithms

> What formulas is your combat based on?

## 33: Architecture Planning

> Did you do research? Did you simply open a new project file and start coding away? Or did you have a blueprint (however vague or specific) for the structure of your game's code before even starting? And then later, is there any difference with how you approach planning for a major new feature, or small features, that are added once the project is already in development?

## 34: Feature Planning

> How do you plan your roguelike's features? Do you have a design document? What does it look like? How detailed is it? How closely have you adhered to it throughout development? Do you keep it updated? What method(s) do you use to plan/record/track features?

## 35: Playtesting and Feedback

> Where do you get feedback? Private playtesters? Public downloads? Do you do anything to ensure good feedback? What features do you have in place to make playtesting and feedback easier? How do you receive and manage feedback?

## 36: Character Progression

> How do you enable character progress? An XP system? Some other form of leveling? Purely equipment-based? A combination of skills and items?

Skills

Items

## 37: Hunger Clocks

> What form of hunger clock do you use in your roguelike? How does the player interact with it? What other systems tie into it? Or maybe you don't use a hunger clock at all? Why?

## 38: Identification Systems

> Does your roguelike contain an identification system, or perhaps some similar feature? How does it work? What purpose does it serve?

## 39: Analytics

> Do you know how many people are playing your game? How many games did they play today? How many new players found your game for the first time today? What else do you track with analytics? How is the system implemented?

## 40: Inventory Management

> Describe your inventory system and the interface players use to interact with it. How does it fit in with the design of the rest of the game? What does the inventory and/or its UI do especially well? Poorly?

## 41: Time Systems

> How do the time system(s) in your roguelike work? Is it as discrete as one action per turn? Or something else? What implications does the system have for the gameplay? What kinds of actions are available in your roguelikes, and how long do they take?

## 42: Achievements and Scoring

> How does your roguelike measure success? Does it have a numerical score system? How does the player earn points? Are there achievements? Any features to facilitate competition?

## 43: Tutorials and Help

> How does your roguelike teach the commands? The mechanics? Does it have a tutorial? How/what does it teach? What other learning resources does the player have access to?

## 44: Ability and Effect Systems

> How is your "ability and effect" system built? Hard-coded? Scripted and interpreted? Inheritance? ECS? How do you implement unique effects? Temporary effects? Recurring effects? How flexible is your system overall--what else can it do?

## 45: Libraries Redux

See [question 1](#1-languages-and-libraries).

## 46: Optimization

> What is the slowest part of your roguelike? Where have you had to optimize? How did you narrow down the problem(s)? What kinds of changes did you make?

## 47: Options and Configuration

> What kinds of options does your roguelike make available to players? UI/gameplay/other features? How does the player modify these options? In game? Or maybe via external files (txt/ini/xml/json/lua/etc)
