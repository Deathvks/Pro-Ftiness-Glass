export const createRoutineEditorSlice = (set, get) => ({
  routineEditorState: {
    routineId: null,
    routineName: "",
    description: "",
    folder: "",
    imageUrl: null,
    exercises: [],
  },
  setRoutineEditorState: (newState) => {
    set((state) => {
      const resolvedState = typeof newState === 'function' ? newState(state.routineEditorState) : newState;
      const updated = { ...state.routineEditorState, ...resolvedState };
      if (typeof localStorage !== "undefined") localStorage.setItem("routineEditorState", JSON.stringify(updated));
      return { routineEditorState: updated };
    });
  },
  clearRoutineEditorState: () => {
    const defaultState = { routineId: null, routineName: "", description: "", folder: "", imageUrl: null, exercises: [] };
    set({ routineEditorState: defaultState });
    if (typeof localStorage !== "undefined") localStorage.removeItem("routineEditorState");
  },
  loadRoutineEditorState: () => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("routineEditorState");
      if (stored) {
        try {
          set({ routineEditorState: JSON.parse(stored) });
        } catch(e) {}
      }
    }
  }
});
