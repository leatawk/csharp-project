const ErrorMessage = ({ message }) => (
  message ? <div className="alert alert-danger">{message}</div> : null
);
export default ErrorMessage;
