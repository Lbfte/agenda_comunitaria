import { useState } from 'react';
import './Home.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Geral');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="home-wrapper">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo-small">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'Pessoal' ? 'active' : ''}`}
              onClick={() => setActiveTab('Pessoal')}
            >
              Pessoal
            </button>
            <button 
              className={`tab-btn ${activeTab === 'Geral' ? 'active' : ''}`}
              onClick={() => setActiveTab('Geral')}
            >
              Geral
            </button>
          </div>
        </div>

        <nav className="main-nav">
          <button className="nav-item active-nav">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="nav-label">Home</span>
          </button>
          <button className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 12 12 17 22 12"></polyline>
              <polyline points="2 17 12 22 22 17"></polyline>
            </svg>
          </button>
          <button className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </button>
          <button className="nav-item notification-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </nav>
      </header>


      <main className={`main-content ${isExpanded ? 'is-expanded' : ''}`}>
        <div className="left-sidebar">
          {/* GREETING */}
          <section className="greeting">
            <h1>Olá, Nome!</h1>
            <p>você está na turma “Ciencias da Comp”</p>
          </section>

          {/* QUICK ADD */}
          <button className="quick-add">
            <span className="plus-icon">+</span>
            Adicionar lembrete
          </button>

          {/* FILTERS */}
          <section className="filters">
            <div className="filters-header">
              <h2>Filtrando por</h2>
              <button className="see-more">ver mais...</button>
            </div>
            <div className="chips">
              <div className="chip">Formas <span>x</span></div>
              <div className="chip">Cores <span>x</span></div>
            </div>
          </section>

          {/* CALENDAR HEADER & MONTHLY VIEW */}
          <section className="calendar-section small-calendar">
            <div className="calendar-header">
              <h2>Março, 2026</h2>
              <div className="expand-container mobile-only">
              <span className="expand-tooltip">{isExpanded ? 'Minimizar' : 'Expandir'}</span>
              <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="monthly-view">
            <div className="week-days-card">
              <span>D</span>
              <span>S</span>
              <span className="active-day">T</span>
              <span>Q</span>
              <span>Q</span>
              <span>S</span>
              <span>S</span>
            </div>
            
            <div className="days-grid-card">
              <div className="days-grid">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div key={day} className={`day-cell ${day === 17 ? 'highlight-day' : ''}`}>
                    {day}
                  </div>
                ))}
                <div className="add-task-wrapper">
                  <button className="add-task-btn">
                    <span className="plus-icon-thick">+</span> Tarefas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>

        <div className="right-area">
          <div className="weekly-calendar-card weekly-view">
            <div className="weekly-scroll-indicator mobile-only">
              <div className="weekly-scroll-thumb"></div>
            </div>

            <div className="weekly-wrapper">
              {/* First header row: days of week */}
              <div className="weekly-header-letters">
                <div className="time-header-cell"></div>
                <div className="days-letters-grid">
                  <span>D</span>
                  <span>S</span>
                  <span className="active-day">T</span>
                  <span>Q</span>
                  <span>Q</span>
                  <span>S</span>
                  <span>S</span>
                </div>
                <div className="scroll-spacer mobile-only"></div>
              </div>

              {/* Second header row: dates */}
              <div className="weekly-header-dates">
                <div className="time-header-cell">H</div>
                <div className="days-dates-grid">
                  <span>15</span>
                  <span>16</span>
                  <span className="highlight-day-weekly">17</span>
                  <span>18</span>
                  <span>19</span>
                  <span>20</span>
                  <span>21</span>
                </div>
                <div className="scroll-spacer mobile-only"></div>
              </div>

              {/* Grid body */}
              <div className="weekly-body">
                <div className="time-column">
                  <div className="time-slot">0:00</div>
                  <div className="time-slot">1:00</div>
                  <div className="time-slot">2:00</div>
                  <div className="time-slot">3:00</div>
                  <div className="time-slot">4:00</div>
                </div>
                <div className="grid-content">
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    Array.from({ length: 7 }).map((_, colIndex) => {
                      let event = null;
                      if (rowIndex === 0 && colIndex === 2) event = "aniversario..\n0:00-23:59";
                      
                      return (
                        <div key={`${rowIndex}-${colIndex}`} className="grid-cell">
                          {event && <div className="event-block">{event}</div>}
                        </div>
                      );
                    })
                  ))}
                </div>
                <div className="weekly-scrollbar desktop-scrollbar">
                  <div className="weekly-scroll-thumb-vert"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
