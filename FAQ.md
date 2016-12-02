# FAQ Friday questions

[1: Languages and Libaries](#1-languages-and-libraries)  
[2: Development Tools](#2-development-tools)  
[3: The Game Loop](#3-the-game-loop)  
[4: World Architecture](#4-world-architecture)  
[5: Data Management](#5-data-management)  
[6: Content Creation and Balance](#6-content-creation-and-balance)  
[7: Loot](#7-loot)  
[8: Core Mechanic](#8-core-mechanic)  
[9: Debugging](#9-debugging)  
[10: Project Management](#10-project-management)  
[11: Random Number Generation](#11-random-number-generation)  
[12: Field of Vision](#12-field-of-vision)  
[13: Geometry](#13-geometry)  
[14: Inspiration](#14-inspiration)  
[15: AI](#15-ai)  
[16: UI Design](#16-ui-design)  
[17: UI Implementation](#17-ui-implementation)  
[18: Input Handling](#18-input-handling)  
[19: Permadeath](#19-permadeath)  
[20: Saving](#20-saving)  
[21: Morgue Files](#21-morgue-files)  
[22: Map Generation](#22-map-generation)  
[23: Map Design](#23-map-design)  
[24: World Structure](#24-world-structure)  
[25: Pathfinding](#25-pathfinding)  
[26: Animation](#26-animation)  
[27: Color](#27-color)  
[28: Map Object Representation](#28-map-object-representation)  
[29: Fonts and Styles](#29-fonts-and-styles)  
[30: Message Logs](#30-message-logs)  
[31: Pain Points](#31-pain-points)  
[32: Combat Algorithms](#32-combat-algorithms)  
[33: Architecture Planning](#33-architecture-planning)  
[34: Feature Planning](#34-feature-planning)  
[35: Playtesting and Feedback](#35-playtesting-and-feedback)  
[36: Character Progression](#36-character-progression)  
[37: Hunger Clocks](#37-hunger-clocks)  
[38: Identification Systems](#38-identification-systems)  
[39: Analytics](#39-analytics)  
[40: Inventory Management](#40-inventory-management)  
[41: Time Systems](#41-time-systems)  
[42: Achievements and Scoring](#42-achievements-and-scoring)  
[43: Tutorials and Help](#43-tutorials-and-help)  
[44: Ability and Effect Systems](#44-ability-and-effect-systems)  
[45: Libraries Redux](#45-libraries-redux)  
[46: Optmization](#46-optimization)  
[47: Options and Configuration](#47-options-and-configuration)  
[48: Developer Motivation](#48-developer-motivation)  
[49: Awareness Systems](#39-awareness-systems)  

## 1: Languages and Libraries

> What languages and libraries are you using to build your current roguelike? Why did you choose them? How have they been particularly useful, or not so useful?

Many a Rogue is written in Javascript.  
Pros:

* I had prior experience with the language
* Cross-platform and install-free
* Lots of freedom, with dynamic typing, prototypical inheritance, and first-class functions
* Fast development cycle
* Easy UI with HTML/CSS

Cons:

* Client-side, can't prevent cheating
* Lots of freedom, with dynamic typing, prototypical inheritance, and first-class functions
* Not as fast as other languages

I do not use rot.js, the most popular roguelike library, because I like having more control over the specifics of my game, and using rot.js prevents me from making certain quirks and optimizations that I like. Right now, I use a heap library for use in pathfinding, and an rng library because javascript's default rng can't be seeded.

## 2: Development Tools

> What kind of publicly available tools do you use to develop your roguelike(s)? What for? Have you built any of your own tools? And if so, what do they do?

I write my code in Sublime Text 2 and execute it in Chrome with no development-related addons.

## 3: The Game Loop

> How do you structure your game loop? Why did you choose that method? Or maybe you're using an existing engine that already handles all this for you under the hood?

The Display receives user input and tells it to the Game, which is independent of UI. The game processes that input (see the [time systems](#41-time-systems) question for more details) and gives the Display some output. That output is placed in a schedule, then animated when the game says its ready for more input.

## 4: World Architecture

> How do you divide and organize the objects of your game world? Is it as simple as lists of objects? How are related objects handled?

My game is rather simple. There is no overworld or branches, and only the current level is generated and stored at any time. There are two places where information about the world is stored:

Game

* Handles game state and mechanics
* Stores map information in a 2d array of tiles  
  Each tile can have:
  * A type: wall, floor, etc
  * Properties like passable and transparent
  * An item: Anything that can be picked up
  * An actor: Either the player or a monster. Not all actors have to be stored on the map
  * A prop: Anything else that is on the tile, eg grass, stairs, traps

Display

* Handles input and output
* Stores map information in a 2d array of tiles. Tiles are similar to those in the Game code, but they lack the innards necessary for game mechanics, and instead have extra appearance-related information.

The Game only tells the Display about changies in what the player can see, and it relies on the Display to store what little game state it is aware of and display it. Because of this, only changes in fov and the like cause redraws, which helps speed things up.

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

* utility {436 lines} general helper functions that could be used in a different game.
* game {469 lines} handles game state and game logic
* display {597 lines} handles input and output

Besides those 3 javascript files, I use two libraries and some HTML and CSS for the display.

## 11: Random Number Generation

> What type of RNG do you use? Is it provided by the language or an external library? Is there anything interesting you do with random numbers? Do you store seeds? Bags of numbers? Use predictable sequences?

Javascript's default rng is unseedable, so I use a library called [seedrandom.js](https://github.com/davidbau/seedrandom). I seed games and use separate prngs for level generation and everything else so that I can deterministically reproduce level generation bugs. In the future, I might do recordings Brogue style, where I simulate the game with the same seed, playing through the user inputs.

## 12: Field of Vision

> What FOV algorithm do you use, and why? Does it have any drawbacks or particularly useful characteristics? Does it have bidirectional symmetry? Is it fast? How did you come up with it?

I use recursive shadowcasting. It's fast, efficient, and elegant. To quickly summarize how the algorithm works, it casts arcs of light at increasing ranges, recursively splitting into smaller arcs when it encounters obstables. I think it's just about a perfect algorithm for rectangular grids, where you can sweep octants, and everything is generally understandable. However, Many a Rogue uses a hex grid, so I use a radial variant that sweeps out arcs instead of lines. Hexagon math is a bit complicated, so I pretend that walls are diamonds that point towards the origin. That means that, unlike the rectangular version, the hex version of recursive shadowcasting lacks perfect bidirectional symmetry. Still, I think the shapes it produces are lovely and intuitive. 

Also, figuring out weather walls are in FOV has always been a massive pain, especially when I was trying to antialias my FOV for an earlier project. Now, I ignore walls when calcularing fov, and I light them after I light floors.

n.b. The simplest version of recursive shadowcasting does not have bidirectional symmetry. All you need to do to ensure symmetry is to only light tiles whose *centers* lie in the lit area.

## 13: Geometry

> Does it use continuous space? Does it use hexes, squares, or something else? If square, is movement Chebyshev, Euclidean, or Taxicab? Same question for line of sight and effects with limited range.

Many a Rogue uses a hex grid. This works well because the game takes place in caves, and hexes tend to shine when representing natural formations as opposed to artificial structures. Hexes are also very nice because you no longer have to deal with diagonals or any sort of varying movement costs. The challenges of using hexes are that it is less intuitive to control, and its more difficult to display the grid. Games like Cogmind and Pyromancer subdivide the main grid for particle effects, which is still possible but less symmetric if using hexes. There's also less free assests floating around for hex games, but I talk more about that in the [map object representation](#28-map-object-representation) question.

## 14: Inspiration

> What are sources of inspiration for your project(s)? Movies? Books? History? Other games? Other people? Anything, really...

* My favorite game, a little flash game called Sonny 2
* Two other flash games, Starfighter: Disputed Galaxy and Realm of the Mad God
* The roguelikes I play semi-frequently: Brogue and Sil
* /r/roguelikedev
* Mythology and fables
* More that doesn't come to mind right now

## 15: AI

> What's your approach to AI?

Noise

Each actor has a hear function. When noise is produced, a function makeNoise is called, which iterates through the map and calls each actor's hear function with the source, strength, and type of sound produced. The hear function is then in charge of changing the actor's state

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

*One map to rule them all, one map to find them,*  
*One map to bring them all and in the darkness bind them.*

The bulk of my map generation was inspired by ais523's algorithm for Gehennom Caverns.

> The algorithm for this is really cool, actually: it starts out by making a list of all the positions on the map, shuffles them into a random order, then goes through in that order deciding what to do with each tile based on what is adjacent to it so far. If nothing next to it is decided yet, then a choice is made at random, but this random choice can be weighted. Currently, it's weighted based on the depth of the level within the Gehennom branch, so that near the top you get rather open levels, and near the bottom you get a lot of nooks and crannies and corridors. ... a square becomes a wall if it's adjacent to exactly one run of walls (looking at the 8 squares running around it), and a floor if it's adjacent to more than one run of walls (which mathematically prevents the level becoming disconnected)

What I do:

* Fill all tiles with wall
* Turn the starting point into floor. The starting point is determined by where the player descended from. By default, it is the center of the map for the first level.
* Iterate through all inner tiles (those that are not on the edge of the map) in random order: if the number of groups of floor tiles around a tile is not one, turn that tile into floor. This generates a bunch of twisty, loopy passageways with small clumps of open space.
* Fill in floor tiles with walls if they aren't reachable from the starting point.
* Remove groups of walls with less than 6 wall tiles. Now it starts to look cavey.
* Fill dead ends with walls. A cave tile is a floor tile that is adjacent to a single contiguous group of floor tiles. A cave is a contiguous group of cave tiles. A dead end is a one-tile cave. Also, during this step, if I happen to fill the starting point with a wall, I move it to a neighboring floor tile.
* Look for groups of walls completely surrounded by floor tiles that are not cave tiles. Turn thoose walls into floors. This eliminates loops of tunnels.
* Check the size of the level. If it is too small, restart.
* Place the player at the starting point.
* Place tripwires. 

## 23: Map Design

> What's your process for designing maps? How do the map layouts reflect your roguelike's mechanics, content, theme, strategies, and other elements? What defines a fun/challenging/thematic/??? map for you/your game?

I stumbled across ais523's cave algorithm, tried it for hex, and fiddled with it until it was satisfactory. Since I had spent so much time working on it, I'm almost obligated to use caves now. 

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

I have a file called utility.js that has beautiful utility functions that are geometry independent, simple to understand, ~~well commented~~, and useful for just about any roguelike I try to make. This file has:

* hex directions
* lines, rays, distance
* fov
* rng helper functions
* hex grid stuff that is helpful for level generation
* game loop

Everything else in my code is a pain point.

## 32: Combat Algorithms

> What formulas is your combat based on?

The core of combat is the concept of Initiative. Initiative is a number from 0 to 100 that represents an actor's energy, alertness, and combat advantage in general. Base initiative is 50. Initiative affects and is affected by combat. There are a bunch of cool implications of this system:

* Melee combat is more interesting because the outcome of each attack matters
* Ambushes! If an actor is attacked from an unknown source, it loses a lot of initiative.
* Certain abilities recharge initiative through movement, breaking the usual arrow key monotony.

## 33: Architecture Planning

> Did you do research? Did you simply open a new project file and start coding away? Or did you have a blueprint (however vague or specific) for the structure of your game's code before even starting? And then later, is there any difference with how you approach planning for a major new feature, or small features, that are added once the project is already in development?

## 34: Feature Planning

> How do you plan your roguelike's features? Do you have a design document? What does it look like? How detailed is it? How closely have you adhered to it throughout development? Do you keep it updated? What method(s) do you use to plan/record/track features?

## 35: Playtesting and Feedback

> Where do you get feedback? Private playtesters? Public downloads? Do you do anything to ensure good feedback? What features do you have in place to make playtesting and feedback easier? How do you receive and manage feedback?

## 36: Character Progression

> How do you enable character progress? An XP system? Some other form of leveling? Purely equipment-based? A combination of skills and items?

Attributes

* Life - How many hitpoints a character has. When these run out, it dies
* Strength - Phyisical ability

Skills

Almost everything the player can do in Many a Rogue is a skill. For example, here is one of the player's starting skills:

*Unarmed Combat*  
Trigger: Bump into an enemy  
Conditions: Have no weapon equipped  
Effect: Deal damage to the enemy equal to your strength
On Level Up: +1 Strength 

The first line specifies how the skill can be activated: either though a trigger for active abilities, a toggle for temporary effects, or nothnig for a passive effect. 

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

## 48: Developer Motivation

> How do you get motivated? How do you stay motivated?

## 49: Awareness Systems

> How does your roguelike allow the player and/or other entities to discover or avoid each other? What other systems or features tie into this?
