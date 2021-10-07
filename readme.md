# josiahayres/react-hooks

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

react-hooks is a collection of React Hooks, written in Typescript.

## Installation

Use the package manager [npm](https://www.npmjs.com) to install josiahayres/react-hooks.

```bash
npm install josiahayres/react-hooks
```

## Background

When you have forms with multiple sections, this hook helps by enforcing the following rules:

1. Only one section can be active at a time.
2. Optionally, can only edit one section at a time.
3. Each section

You are responsible for ensuring each Section must control

- validation of each section, when to let user go to next section.
- Section State: Active vs Summary & what is displaye at each point
- Data collection from each section & what to do with the data once submitted.
- Showing user submit button

## Usage

```typescript
import { useFormSectionsControl } from 'josiahayres/react-hooks';

// Create a Union type with all valid section IDs
type ValidFormSectionIds =
  | 'sectionOne'
  | 'sectionTwo'
  | 'sectionThree'
  | 'sectionFour';

// This form uses three sections.
const sectionIds = ['sectionOne', 'sectionTwo', 'sectionThree'];

// Initialize hook in component
const formSectionsControl =
  useFormSectionControl<ValidFormSectionIds>(sectionIds);
```

## formSectionControl

Is a tuple with the following:

```javascript
const [store, dispatch, canEditSection] = formSectionsControl;
```

Each item

### store

Also accessable as `formSectionsControl[0]`.

```typescript
// Store object can be destructured like this
const { activeSectionId, haveVisitedSummary, formSections, options } = store;
```

| Store              | Notes                                                                                                 |
| :----------------- | :---------------------------------------------------------------------------------------------------- |
| activeSectionId    | One of provided formSections or null                                                                  |
| haveVisitedSummary | True once dispatch({type:"gotToNextSection"}) called when activeSectionId is last id in provided list |
| formSections       | Same as provided list of formSections, see section below for more                                     |
| options            | Same as provided options object, see section below for more                                           |

#### options

This is the options object as provided to the hook on setup.
All options in this object are optional.

| Key                    | When key has value: | Notes                                                                    |
| :--------------------- | :------------------ | :----------------------------------------------------------------------- |
| initialActiveSectionId | null                | haveVisitedSummary=true, activeSectionId=null                            |
| initialActiveSectionId | "sectionOne"        | haveVisitedSummary=false, activeSectionId="sectionOne"                   |
| initialActiveSectionId | Not provided        | haveVisitedSummary=false, activeSectionId=first section in provided list |

### dispatch

| Action Type     | Action Parameters | Notes                                                                               |
| :-------------- | :---------------- | :---------------------------------------------------------------------------------- |
| reset           | None              | Will reset internal hook state to value at initial render                           |
| goToNextSection | None              | Will step through each section in list provided, until no more sections are active. |
| goTo            | sectionId         | Sets a specific sectionId active                                                    |

```typescript
// Typescript will help dispatching the correct actions
dispatch({ type: 'goToNextSection' });
dispatch({ type: 'goTo', sectionId: 'sectionTwo' });
dispatch({ type: 'reset' });
```

### canEditSection

Say we have a form with three sections.
How they fill out Section One will affect what they see in section two and so on.

In this case we need to allow users

```typescript
const sectionOneEditable = canEditSection('sectionOne');
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
