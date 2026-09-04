# Oaz Custom Snap! Version Specification

This document specifies the custom changes applied to the upstream Snap! codebase to create the Oaz custom version. These changes are designed to be **minimal, non-invasive, and easily re-applicable** to any future upstream/master version.

Each change is documented by its **functional intent** and **implementation approach**, rather than exact line numbers or code locations, since upstream code evolves between versions.

---

## 1. Application Initialization (snap.html)

### Intent
Customize the IDE startup to:
- Suppress development version incompatibility warnings (safe for local development)
- Remove cloud-related UI menus (not needed for local use)
- Apply a slight zoom to blocks by default for better readability

### Implementation
Modify the `IDE_Morph` instantiation in the `window.onload` handler to pass a configuration object:

```javascript
new IDE_Morph({
    noDevWarning: true,
    noCloud: true,
    blocksZoom: 1.2
}).openIn(world);
```

### Location Guide
Search for `new IDE_Morph()` in snap.html (typically around line 62) and replace the default constructor call with the configured version above.

### Dependencies
- Requires `IDE_Morph` constructor to accept a configuration object (present in upstream since early versions)
- All three configuration keys (`noDevWarning`, `noCloud`, `blocksZoom`) are supported in upstream/master

---

## 2. Version Identification (gui.js)

### Intent
Clearly identify the running instance as a custom version with attribution and source location.

### Implementation
Two separate modifications:

**A. Version String Suffix**
Find where the Snap! version string is displayed (typically in a `toString()` or version getter method for the IDE or Morphic) and append `-oaz` to the version number.

**B. About Box Text**
Find the about box dialog or version info string (often in a `showAbout` or similar method) and append:
```

Custom version by Oaz. Source code at: https://github.com/Oaz/Snap
```

### Location Guide
Search for:
- Version string construction: look for `version` properties or `Morphic.version`
- About box: look for `about`, `showAbout`, or `versionInfo` methods

### Dependencies
None. Pure string concatenation.

---

## 3. Extensions Visibility (objects.js)

### Intent
Make extension blocks visible by default in the Sprite editor, eliminating the need to manually enable them for each sprite.

### Implementation
Set the prototype default for `showingExtensions`:
```javascript
SpriteMorph.prototype.showingExtensions = true;
```

### Location Guide
Search for `SpriteMorph.prototype` assignments in objects.js. This can be placed with other prototype property initializations, typically in the constructor or near the class definition.

### Dependencies
- Requires `SpriteMorph` class to exist with `showingExtensions` property (present in upstream)

---

## 4. JavaScript Enabled by Default (threads.js)

### Intent
Enable JavaScript code execution by default, allowing JS-based blocks and extensions to work without requiring users to manually enable JS in the settings.

### Implementation
Set the prototype default for `enableJS`:
```javascript
Process.prototype.enableJS = true;
```

### Location Guide
Search for `Process.prototype` assignments in threads.js. This can be placed with other prototype property initializations.

### Dependencies
- Requires `Process` class to exist with `enableJS` property (present in upstream)

---

## 5. Extension Unload Capability (extensions.js)

### Intent
Enable dynamic unloading of extensions during development. Without this, developers must fully restart the Snap! application to reload modified extension code for the same URL.

### Functional Specification
Adds a new primitive `src_unload(url)` that:
1. Takes a URL string parameter
2. Asynchronously removes the `<script>` element matching that URL from the DOM
3. Removes the URL from `SnapExtensions.scripts` registry
4. Uses Snap!'s continuation mechanism to yield properly and avoid blocking

### Implementation
Add the following primitive to `SnapExtensions.primitives`:

```javascript
SnapExtensions.primitives.set(
    'src_unload(url)',
    function (url, proc) {
        if (!proc.context.accumulator) {
            proc.context.accumulator = {done: false};
            if (!contains(SnapExtensions.scripts, url)) {
                return;
            }
            for (const scriptElement of document.scripts) {
                if (scriptElement.src && scriptElement.src.endsWith(url)) {
                    scriptElement.remove();
                    const index = SnapExtensions.scripts.indexOf(url);
                    SnapExtensions.scripts.splice(index, 1);
                    proc.context.accumulator.done = true;
                }
            }
        } else if (proc.context.accumulator.done) {
            return;
        }
        proc.pushContext('doYield');
        proc.pushContext();
    }
);
```

### Location Guide
Search for `SnapExtensions.primitives.set` calls in extensions.js and add this as a new entry.

### Dependencies
- Requires `SnapExtensions.primitives` Map to exist
- Requires `SnapExtensions.scripts` array to exist
- Requires `contains()` helper function (standard Snap! utility)
- Uses Snap! process continuation mechanism (`proc.pushContext`, `proc.context.accumulator`)

### Notes
- The implementation uses Snap!'s continuation-passing style to properly yield between steps
- Only removes scripts whose `src` ends with the given URL (supports relative paths)
- Silently returns if the URL is not loaded (idempotent)

---

## 6. Additional Sprite Costumes (COSTUMES.json)

### Intent
Add a set of SVG-based sprite costumes that are useful for drawing boxes, frames, and UI elements on the screen. These provide visual building blocks for educational projects.

### Functional Specification
The costumes to add are SVG files located in the repository. Each costume entry in COSTUMES.json follows the format:
```json
{
    "name": "Costume Name",
    "path": "path/to/costume.svg",
    "centerX": 0,
    "centerY": 0,
    "rotationCenterX": 0,
    "rotationCenterY": 0
}
```

### Implementation
Append the Oaz custom costume entries to the existing COSTUMES.json array. The exact entries should be copied from the current origin/main version.

### Location Guide
The COSTUMES.json file contains a single JSON array. Append new entries to the end of this array.

### Dependencies
- File must remain valid JSON
- Costume SVG files must be present in the specified paths

---

## 7. Custom Libraries (LIBRARIES.json)

### Intent
Add a collection of custom block libraries that provide additional functionality for advanced Snap! usage, including:
- Regular expressions
- Additional control structures
- Enhanced list operations
- Stream processing
- Additional operators
- Data structures (dictionaries, etc.)
- Unit testing framework (SUnit)

### Functional Specification
Each library entry in LIBRARIES.json follows the format:
```json
{
    "name": "Library Name",
    "path": "path/to/library.xml"
}
```

The Oaz custom libraries are:
- oaz/regular_expressions.xml
- oaz/MoreControl.xml
- oaz/MoreLists.xml
- oaz/MoreStreams.xml
- oaz/MoreOperators.xml
- oaz/Dictionaries.xml
- oaz/DataStructure.xml
- oaz/SUnit!1.xml
- oaz/SUnit!2.xml

### Implementation
Append the Oaz custom library entries to the existing LIBRARIES.json array. The exact entries should be copied from the current origin/main version.

### Location Guide
The LIBRARIES.json file contains a single JSON array. Append new entries to the end of this array.

### Dependencies
- File must remain valid JSON
- Library XML files must be present in the specified paths (under the libraries/ directory)

---

## Merge Procedure

To apply these changes to a fresh upstream/master checkout:

1. **Checkout upstream/master**: `git checkout -b merge-upstream upstream/master`
2. **Apply changes in order**:
   - Apply snap.html change (depends only on IDE_Morph API)
   - Apply gui.js changes (independent)
   - Apply objects.js change (independent)
   - Apply threads.js change (independent)
   - Apply extensions.js change (depends on SnapExtensions API)
   - Apply COSTUMES.json changes (ensure SVG files exist)
   - Apply LIBRARIES.json changes (ensure XML files exist)
3. **Verify**: Load snap.html in a browser and test each feature
4. **Commit**: Create a single commit with all custom changes

---

## Verification Checklist

After applying changes, verify:

- [ ] snap.html loads without errors
- [ ] No dev warning appears (check console)
- [ ] No cloud menus visible in UI
- [ ] Blocks appear slightly zoomed in
- [ ] Version string shows `-oaz` suffix
- [ ] About box shows custom attribution
- [ ] Extensions are visible by default in sprite editor
- [ ] JavaScript blocks work without enabling JS in settings
- [ ] `src_unload` primitive is available in extensions
- [ ] Custom costumes appear in sprite costume selector
- [ ] Custom libraries appear in library import menu

---

## File Summary

| File | Change Type | Lines Affected | Risk Level |
|------|-------------|----------------|------------|
| snap.html | Configuration | 1-5 | Low |
| gui.js | String modification | 2-5 | Low |
| objects.js | Property assignment | 1 | Low |
| threads.js | Property assignment | 1 | Low |
| extensions.js | New primitive | ~20 | Medium |
| COSTUMES.json | Array entries | Multiple | Low |
| LIBRARIES.json | Array entries | Multiple | Low |
