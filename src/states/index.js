import { combineReducers } from 'redux';

import { reduce as DirectoryReducer } from './DirectoryState';

// Register your redux store under a unique namespace
export const namespace = 'directory-transfer';

// Combine the reducers
export default combineReducers({
    DirectoryReducer: DirectoryReducer
});