// ############################
// This slice is not being used, but I left it in in case I need it as an example in the future
// ############################

const currentConnectionReducer = (state = {}, action) => {
    switch (action.type) {
        case 'connections/currentConnectionSelected':
            return action.payload
        case 'connections/currentConnectionDeselected':
        default:
            return null;
    }
};

export default currentConnectionReducer;
export const currentConnectionSelected = connection => ({type: 'connections/currentConnectionSelected', payload: connection});
export const currentConnectionDeselected = connection => ({type: 'connections/currentConnectionDeselected', payload: connection});

// Selectors
export const selectCurrentConnection = state => state.currentConnection;
