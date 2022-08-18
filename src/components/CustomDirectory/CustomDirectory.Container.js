// Import redux methods
import { connect } from 'react-redux';

// Import the Redux Component
import CustomDirectories from './CustomDirectory';

// Define mapping functions
const mapStateToProps = (state) => {
  return {
    directoryList: state["directory-transfer"].DirectoryReducer.directoryList,    
    response_status: state["directory-transfer"].DirectoryReducer.response_status,
    error: state["directory-transfer"].DirectoryReducer.error
  }
};

// Connect presentational component to Redux
export default connect(mapStateToProps)(CustomDirectories);