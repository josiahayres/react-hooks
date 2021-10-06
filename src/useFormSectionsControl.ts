import React, { useReducer } from 'react';
import type { Dispatch, Reducer } from 'react';

/**
 * Form actions available to Dispatch
 */
export type Action<T> =
  | {
      type: 'reset';
    }
  | {
      type: 'goTo';
      sectionId: T;
    }
  | {
      type: 'goToNextSection';
    };

/** Provide a Union type wtih all possible section IDs. */
export interface State<T> {
  options: Options<T>;
  /** List of sections in form */
  formSections: T[] | [];
  /** Which SectionId is active */
  activeSectionId: T | null;
  /** Has the user gone through all sections */
  haveVisitedSummary: boolean;
}

export type FormSectionControl<T> = [
  /** Internal state of the hook */
  state: State<T>,
  /** Allows you to dispatch actions to change the state */
  dispatch: Dispatch<Action<T>>,
  /** Helper function to be called in each section */
  canEditSection: (sectionId: T) => boolean,
];

/**
 * Change how the hook works
 */
export type Options<T> = {
  /** haveVisitedSummary defaults to this. When it's true, activeSectionId is set to null */
  initialActiveSectionId?: T;
};

/**
 * Manages actions for the hook.
 */
function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  const indexOfActiveSectionId = state.formSections.findIndex(
    (item) => item === state.activeSectionId,
  );
  switch (action.type) {
    case 'reset':
      const initialState = createInitialState(
        state.formSections,
        state.options,
      );
      return Object.assign({}, initialState);
    case 'goTo':
      const indexOfNext = state.formSections.findIndex(
        (item) => item === action.sectionId,
      );
      if (indexOfNext === -1) {
        return {
          ...state,
          activeSectionId: null,
          haveVisitedSummary: true,
        };
      }
      return { ...state, activeSectionId: action.sectionId };
    case 'goToNextSection':
      const goToSummary =
        state.haveVisitedSummary || indexOfActiveSectionId === -1;
      if (goToSummary) {
        return { ...state, activeSectionId: null };
      }
      const nextSectionIndex = indexOfActiveSectionId + 1;
      const isCurrentLast = nextSectionIndex >= state.formSections.length;
      if (isCurrentLast) {
        // Go to summary
        return {
          ...state,
          activeSectionId: null,
          haveVisitedSummary: true,
        };
      } else {
        // Go to next section
        return {
          ...state,
          activeSectionId: state.formSections[nextSectionIndex],
        };
      }
    default:
      // TODO: Notify user of unexpected action recieved
      return { ...state };
  }
}

function createInitialState<T>(
  formSections: T[],
  options: Options<T>,
): State<T> {
  const firstSectionId = formSections.length > 0 ? formSections[0] : null;

  // Allow null as value upfront.
  // Then use firstSectionId when options.initialActiveSectionId valid (truthy),
  // otherwise use firstSectionId
  const initialActiveSection =
    options.initialActiveSectionId === null
      ? null
      : !options.initialActiveSectionId
      ? firstSectionId
      : options.initialActiveSectionId;

  const initialHaveVisitedSummary =
    'initialActiveSectionId' in options
      ? options.initialActiveSectionId === null
      : false;

  return {
    formSections,
    activeSectionId: initialActiveSection,
    haveVisitedSummary: initialHaveVisitedSummary,
    options,
  };
}

/**
 * This hook controls which form section is active & provides a function that lets each section know if it can be edited.
 */
function useFormSectionsControl<T>(
  formSections: T[],
  options?: Options<T>,
): FormSectionControl<T> {
  // activeSectionId defaulted to first item in sections
  const initialState: State<T> = React.useMemo(() => {
    return createInitialState(formSections, { ...options });
  }, [formSections, options]);

  const [state, dispatch] = useReducer<Reducer<State<T>, Action<T>>>(
    reducer,
    initialState,
  );

  /**
   * If no sections are active, all can be edited.
   */
  const canEditSection = React.useCallback(
    (sectionId: T): boolean => {
      if (state.activeSectionId === sectionId) return false;
      if (state.activeSectionId === null) return true;
      if (state.haveVisitedSummary && state.activeSectionId !== null)
        return false;
      const indexOfActiveSectionId = state.formSections.findIndex(
        (item) => item === state.activeSectionId,
      );
      const indexOfCurrentSection = state.formSections.findIndex(
        (item) => item === sectionId,
      );
      const isCurrentSectionBeforeActive =
        indexOfCurrentSection < indexOfActiveSectionId;

      return isCurrentSectionBeforeActive;
    },
    [state.activeSectionId, state.formSections, state.haveVisitedSummary],
  );

  return [state, dispatch, canEditSection];
}

export default useFormSectionsControl;
