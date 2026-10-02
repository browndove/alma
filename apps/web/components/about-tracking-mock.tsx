export function AboutTrackingMock() {
  return (
    <div className="about-hero-mock" aria-hidden="true">
      <div className="about-mock-card">
        <div className="about-mock-package">
          <div className="about-mock-brand">
            <span className="about-mock-mark" />
            Diatel Express
          </div>
          <div className="about-mock-eta">28 min</div>
          <p className="about-mock-route">Accra Mall → Oxford Street, Osu</p>
          <div className="about-mock-box">
            <span className="about-mock-box-lid" />
            <span className="about-mock-box-body" />
            <span className="about-mock-box-tape" />
          </div>
          <div className="about-mock-status">
            <span className="about-mock-dot" />
            Rider en route · DT-94821
          </div>
          <div className="about-mock-footer">
            <span>Powered by Diatel</span>
            <span>Track</span>
            <span>Support</span>
          </div>
        </div>

        <div className="about-mock-form">
          <div className="about-mock-section-title">Delivery details</div>
          <label className="about-mock-field">
            <span>Tracking ID</span>
            <span className="about-mock-input">DT-94821</span>
          </label>
          <label className="about-mock-field">
            <span>Drop-off address</span>
            <span className="about-mock-input about-mock-input-select">
              Oxford Street, Osu
            </span>
          </label>

          <div className="about-mock-section-title">Service</div>
          <div className="about-mock-methods">
            <div className="about-mock-method">
              <span className="about-mock-radio" />
              Standard
            </div>
            <div className="about-mock-method is-active">
              <span className="about-mock-radio is-on" />
              <div>
                <strong>Same-day</strong>
                <p>Rider matched · live GPS until drop-off.</p>
              </div>
            </div>
            <div className="about-mock-method">
              <span className="about-mock-radio" />
              Scheduled
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
