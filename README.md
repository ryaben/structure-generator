# Structure Generator

Simple tool that allows to automatically generate a structure.json file and other functionalities.

## What does this webapp do

Structure Generator is a very simple, yet (I think) useful tool that serves as a helper/wizard when we create new IVA projects, mainly for those that imply development from scratch for UP (Vue.js). As we know, all IVA projects require a structure.json file for the navigation to work properly. This JSON file demands some properties filled out with information. Also, after that, we need to create the slides folder that will contain all index.vue files. These processes can turn out to be boring and monotone, especially for bigger projects. Hence, these are the solutions that this tool offers:

- **Helper for autogenerating a structure.json file:** A GUI is provided to manipulate an instance that emulates this file. User can add chapters and slides, and delete/rename them afterwards if needed.
- **Slides folder generator:** By passing a structure.json's source code, this feature will provide a .zip file that contains a folder with all slides and popups, with media/images folder and index.vue included. The Vue file is filled with the code from global-iva-template, or also the user can paste custom code.
- **Format a structure.json from Cobalt**: The procedure is already easy to perform manually with a couple replaces in VSC, but this feature allows to simplify it to even just a few seconds.
