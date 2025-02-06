import React, { useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faArrowRight, faKey } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../AuthContext';
import UserAvatar from '../../components/Auth/UserAvatar';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    if (params.get('passwordChanged') === 'true') {
      // Add hidden form for password manager context
      const form = document.createElement('form');
      form.style.display = 'none';
      form.innerHTML = `
            <input type="text" name="username" autocomplete="username" value="${params.get('email') || ''}" />
            <input type="password" name="password" autocomplete="current-password" />
        `;
      document.body.appendChild(form);

      // Clean up after password manager has a chance to detect it
      setTimeout(() => {
        document.body.removeChild(form);
        // Clean up URL
        window.history.replaceState({}, '', '/profile');
      }, 3000);
    }
  }, [params]);

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h3 className="mb-2">
          <FontAwesomeIcon icon={faUser} className="me-2" />
          My Profile
        </h3>
        <p className="text-muted mb-0">
          Manage your account settings and profile information.
        </p>
        <hr className="mt-2" />
      </div>

      <div className="d-flex justify-content-center">
        <Card style={{ maxWidth: '600px', width: '100%' }} className="shadow">
          <Card.Body>
            <div className="text-center mb-4">
              <div className="d-flex justify-content-center">
                <UserAvatar email={user?.email} size={128} />
              </div>
              <h4 className="mt-3 mb-1">{user?.email}</h4>
              <p className="text-muted small">
                Your avatar is automatically loaded from <a href="https://gravatar.com/" target="_blank">Gravatar</a>, if present.
              </p>
            </div>

            <div className="mt-4">
              <h5 className="mb-3">Account Information</h5>
              <dl className="row">
                <dt className="col-sm-3">Email</dt>
                <dd className="col-sm-9">{user?.email}</dd>

                <dt className="col-sm-3">Password</dt>
                <dd className="col-sm-9">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/change-password')}
                    className="d-inline-flex align-items-center"
                  >
                    Change Password
                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </Button>
                </dd>
              </dl>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Profile;