/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import useFormSectionsControl, {
  FormSectionControl,
} from './useFormSectionsControl';
import {
  renderHook,
  act,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { render, screen, fireEvent } from '@testing-library/react';

let renderCount = 0;

type TestFormSectionIds =
  | 'sectionOne'
  | 'sectionTwo'
  | 'sectionThree'
  | 'sectionFour';

const SimpleFormSection = ({
  sectionId,
  formSectionControl,
}: {
  sectionId: TestFormSectionIds;
  formSectionControl: FormSectionControl<TestFormSectionIds>;
}) => {
  const [{ activeSectionId }, dispatch, canEditSection] = formSectionControl;

  const active = activeSectionId === sectionId;
  const canEdit = canEditSection(sectionId);

  return (
    <div>
      {canEdit && (
        <button
          type="button"
          data-testid={`edit_${sectionId}`}
          onClick={() => dispatch({ type: 'goTo', sectionId })}
        >{`set active ${sectionId}`}</button>
      )}

      {!active && <p>{`${sectionId} NOT ACTIVE`}</p>}
      {active && <h3>{`${sectionId} IS ACTIVE`}</h3>}

      {active && (
        <button
          type="button"
          data-testid={`submit_${sectionId}`}
          onClick={() => dispatch({ type: 'goToNextSection' })}
        >{`submit ${sectionId}`}</button>
      )}
    </div>
  );
};

/**
 * Simulates a complex form with multiple sections.
 * @returns React component -
 */
const TestForm = () => {
  const formSectionControl = useFormSectionsControl<TestFormSectionIds>([
    'sectionOne',
    'sectionTwo',
    'sectionThree',
  ]);
  const [store] = formSectionControl;
  renderCount++;
  return (
    <div>
      <h1>{`Active: ${JSON.stringify(store.activeSectionId)}`}</h1>
      <p>{`render count: ${renderCount}`}</p>
      <SimpleFormSection
        sectionId="sectionOne"
        formSectionControl={formSectionControl}
      ></SimpleFormSection>
      <SimpleFormSection
        sectionId="sectionTwo"
        formSectionControl={formSectionControl}
      ></SimpleFormSection>
      <SimpleFormSection
        sectionId="sectionThree"
        formSectionControl={formSectionControl}
      ></SimpleFormSection>
    </div>
  );
};

describe('hooks/useFormSectionsControl', () => {
  let renderedHook: RenderHookResult<
    string[],
    FormSectionControl<
      'sectionOne' | 'sectionTwo' | 'sectionThree' | 'sectionFour'
    >
  >;
  beforeEach(() => {
    renderedHook = renderHook(() =>
      useFormSectionsControl([
        'sectionOne',
        'sectionTwo',
        'sectionThree',
        'sectionFour',
      ]),
    );
  });

  test('Hook returns expected values', () => {
    const { result } = renderedHook;
    const [store, dispatch, connectSection] = result.current;

    // Check activeSectionId
    expect(store).not.toBe(null);
    expect(store.activeSectionId).not.toBeNull();
    expect(store.activeSectionId).toBe('sectionOne');
    expect(store.formSections).toHaveLength(4);
    expect(typeof dispatch).toBe('function');
    expect(typeof connectSection).toBe('function');
  });

  test('dispatch(goToNextSection) works', () => {
    const { result } = renderedHook;
    expect(result.current?.[0].activeSectionId).toBe('sectionOne');
    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    expect(result.current?.[0].activeSectionId).toBe('sectionTwo');
  });

  test('dispatch(goTo) to sectionOne from sectionTwo works', () => {
    const { result } = renderedHook;

    expect(result.current?.[0].activeSectionId).toBe('sectionOne');
    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    expect(result.current?.[0].activeSectionId).toBe('sectionTwo');
    act(() =>
      result.current?.[1]({
        type: 'goTo',
        sectionId: 'sectionOne',
      }),
    );
    expect(result.current?.[0].activeSectionId).toBe('sectionOne');
    expect(result.current?.[0].activeSectionId).not.toBe('sectionTwo');
  });

  test('dispatch(goTo) with invaild sectionId takes user to summary', () => {
    const { result } = renderedHook;

    expect(result.current?.[0].activeSectionId).toBe('sectionOne');

    // Force TS to skip checking dispatching an invalid action.
    // This builds up code coverage
    act(() =>
      // @ts-ignore: This next action should give TS warning without this
      result.current?.[1]({ type: 'goTo', sectionId: 'invalidSectionId' }),
    );
    expect(result.current?.[0].activeSectionId).toBeNull();
    expect(result.current?.[0].haveVisitedSummary).toBeTruthy();
  });

  test('dispatch(reset) works ', () => {
    const { result } = renderedHook;

    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    act(() => result.current?.[1]({ type: 'goToNextSection' }));

    expect(result.current?.[0].activeSectionId).toBeNull();
    expect(result.current?.[0].haveVisitedSummary).toBeTruthy();

    act(() => result.current?.[1]({ type: 'goTo', sectionId: 'sectionOne' }));
    act(() => result.current?.[1]({ type: 'reset' }));

    expect(result.current?.[0].activeSectionId).not.toBeNull();
    expect(result.current?.[0].activeSectionId).toBe('sectionOne');
    expect(result.current?.[0].haveVisitedSummary).toBeFalsy();
  });

  test('haveVisitedSummary is updated', () => {
    const { result } = renderedHook;

    expect(result.current?.[0].activeSectionId).toBe('sectionOne');
    expect(result.current?.[0].haveVisitedSummary).toBeFalsy();
    act(() => result.current?.[1]({ type: 'goToNextSection' })); // Go to section 2
    act(() => result.current?.[1]({ type: 'goToNextSection' })); // Go to section 3
    act(() => result.current?.[1]({ type: 'goToNextSection' })); // Go to notifications
    act(() => result.current?.[1]({ type: 'goToNextSection' })); // Go to summary
    expect(result.current?.[0].activeSectionId).toBeNull();
    expect(result.current?.[0].haveVisitedSummary).toBeTruthy();
  });

  test('Option initialActiveSectionId works when set', () => {
    const { result } = renderHook(() =>
      useFormSectionsControl(
        ['sectionOne', 'sectionTwo', 'sectionThree', 'sectionFour'],
        { initialActiveSectionId: 'sectionThree' },
      ),
    );

    expect(result.current?.[0].activeSectionId).toBe('sectionThree');
    expect(result.current?.[0].haveVisitedSummary).toBeFalsy();

    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    expect(result.current?.[0].activeSectionId).toBe('sectionFour');

    act(() => result.current?.[1]({ type: 'goToNextSection' }));
    expect(result.current?.[0].activeSectionId).toBeNull();
    expect(result.current?.[0].haveVisitedSummary).toBeTruthy();
  });

  test('haveVisitedSummary is true when initialActiveSectionId set to null', () => {
    const { result } = renderHook(() =>
      useFormSectionsControl(
        ['sectionOne', 'sectionTwo', 'sectionThree', 'sectionFour'],
        { initialActiveSectionId: null },
      ),
    );

    expect(result.current?.[0].activeSectionId).toBeNull();
    expect(result.current?.[0].haveVisitedSummary).toBeTruthy();

    act(() => result.current?.[1]({ type: 'goTo', sectionId: 'sectionTwo' }));

    expect(result.current?.[0].activeSectionId).toBe('sectionTwo');
  });

  test('dispatch(unhandledAction) does not crash', () => {
    const { result } = renderedHook;

    // Force TS to skip checking dispatching an invalid action.
    // This builds up code coverage
    // @ts-ignore: This next action should give TS warning without this
    act(() => result.current?.[1]({ type: 'unhandled' }));
    expect(result.current?.[0].activeSectionId).not.toBeNull();
  });
});

describe('Code coverage bump', () => {
  test('Call hook with empty options object', () => {
    const { result } = renderHook(() =>
      useFormSectionsControl(
        ['sectionOne', 'sectionTwo', 'sectionThree', 'sectionFour'],
        { initialActiveSectionId: null },
      ),
    );
    expect(result.current?.[0].activeSectionId).toBe(null);
  });
  test('Call hook with empty sectionIds, no options', () => {
    const { result } = renderHook(() => useFormSectionsControl([]));
    expect(result.current?.[0].activeSectionId).toBe(null);
  });
  test('Call hook with empty sectionIds, option initialActiveSectionId=null', () => {
    const { result } = renderHook(() =>
      useFormSectionsControl([], { initialActiveSectionId: null }),
    );
    expect(result.current?.[0].activeSectionId).toBe(null);
  });
  test("Call hook with empty sectionIds, option initialActiveSectionId=''", () => {
    const { result } = renderHook(() =>
      useFormSectionsControl([], { initialActiveSectionId: '' }),
    );
    expect(result.current?.[0].activeSectionId).toBe(null);
  });
});

describe('Can render complex form with three sections', () => {
  beforeEach(() => {
    renderCount = 0;
    render(<TestForm />);
  });

  test('First form section is open by default.', () => {
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByText(/one is active/i)).toBeInTheDocument();
    expect(screen.getByText(/two not active/i)).toBeInTheDocument();
    expect(screen.getByText(/three not active/i)).toBeInTheDocument();
  });

  test('Can click through each form section to summary', () => {
    expect(screen.getByText(/active: "sectionOne"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit_sectionOne'));
    expect(screen.getByText(/active: "sectionTwo"/i)).toBeInTheDocument();
    expect(screen.getByText(/one not active/i)).toBeInTheDocument();
    expect(screen.getByText(/two is active/i)).toBeInTheDocument();
    expect(screen.getByText(/three not active/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit_sectionTwo'));
    expect(screen.getByText(/active: "sectionThree"/i)).toBeInTheDocument();
    expect(screen.getByText(/one not active/i)).toBeInTheDocument();
    expect(screen.getByText(/two not active/i)).toBeInTheDocument();
    expect(screen.getByText(/three is active/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit_sectionThree'));
    expect(screen.getByText(/active: null/i)).toBeInTheDocument();
    expect(screen.getByText(/one not active/i)).toBeInTheDocument();
    expect(screen.getByText(/two not active/i)).toBeInTheDocument();
    expect(screen.getByText(/three not active/i)).toBeInTheDocument();
  });

  test("Can't edit a section ahead of active section", () => {
    expect(screen.getByText(/render count: 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit_sectionOne'));

    expect(screen.getByText(/render count: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/active: "sectionTwo"/i)).toBeInTheDocument();
    expect(screen.queryByTestId('edit_sectionOne')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit_sectionTwo'));

    expect(screen.getByText(/render count: 3/i)).toBeInTheDocument();
    expect(screen.queryByTestId('edit_sectionThree')).toBeNull();
    expect(screen.getByText(/active: "sectionThree"/i)).toBeInTheDocument();
    expect(screen.queryByTestId('edit_sectionOne')).toBeInTheDocument();
    expect(screen.queryByTestId('edit_sectionTwo')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit_sectionOne'));

    expect(screen.getByText(/active: "sectionOne"/i)).toBeInTheDocument();
    expect(screen.queryByTestId('edit_sectionTwo')).toBeNull();
    expect(screen.queryByTestId('edit_sectionThree')).toBeNull();
  });

  test('After getting to the summary, submitting an edit in section one should return to the summary, not section two. ', () => {
    fireEvent.click(screen.getByTestId('submit_sectionOne'));
    fireEvent.click(screen.getByTestId('submit_sectionTwo'));
    fireEvent.click(screen.getByTestId('submit_sectionThree'));

    expect(screen.getByText(/active: null/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit_sectionOne'));
    expect(screen.getByText(/active: "sectionOne"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('submit_sectionOne'));
    expect(screen.queryByText(/active: "sectionTwo"/i)).toBeNull();
    expect(screen.getByText(/active: null/i)).toBeInTheDocument();
  });
});
