import { Form, Button } from 'react-bootstrap'
import { Component } from 'react'
import { withRouter } from 'next/router';
import { connect } from 'react-redux';
import { toggleUserRegistration } from '../redux/ui/actions';

class Login extends Component {

  constructor(props) {
    super(props);

    this.state = {
      email: null,
      password: null,
      verify: null,
      register: false
    };

    this.showRegisterForm = this.showRegisterForm.bind(this);
  }

  handleRegisterSubmit = () => {
    console.log(this.state)
  }

  handleLoginSubmit = () => {
    console.log(this.state)
   }

  handleTextInput = (type, value) => {
    let data = {};
    data[type] = value;
     this.setState(data)
  }

  showRegisterForm = () => {
    this.props.toggleUserRegistration(!this.state.register)
    console.log(this.props)
    console.log(this.state)
  }

// todo: switch between login and registration based upon state in redux

  render() {
    const register = this.props.register
    return (
    <Form>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control type="email" placeholder="Enter email" onChange={e => this.handleTextInput('email', e.target.value)} />
        {register &&
            <Form.Text className="text-muted">
              We'll never share your email with anyone else.
            </Form.Text>
        }
      </Form.Group>

      <Form.Group controlId="formBasicPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" placeholder="Password" onChange={e => this.handleTextInput('password', e.target.value)} />
      </Form.Group>

        {register ?
          <>
          <Form.Group controlId="formBasicPasswordVerify">
            <Form.Label>Verify Password</Form.Label>
            <Form.Control type="verify_password" placeholder="Verify Password" onChange={e => this.handleTextInput('verify', e.target.value)} />
          </Form.Group>

          <Button variant="primary" type="submit" onClick={this.handleRegisterSubmit()}>
              Register
          </Button>
          <Button variant="link" onClick={this.showRegisterForm}>
              Login to an Existing Account
          </Button>
            </>
          :
          <>
            <Button variant="primary" type="submit" onClick={this.handleLoginSubmit()}>
              Login
          </Button>
          <Button variant="link" onClick={this.showRegisterForm}>
              Create an Account
          </Button>
            </>
        }
      </Form>
    )
  }

}

const mapStateToProps = state => ({
  register: state.ui.userRegistration,
});

const mapDispatchToProps = dispatch => ({
  toggleUserRegistration: (toggled) => dispatch(toggleUserRegistration(toggled))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Login)) ;
