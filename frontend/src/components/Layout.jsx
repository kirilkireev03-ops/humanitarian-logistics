import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getRole } from '../auth'
import { logout } from '../api'

const linkClass = ({ isActive }) => (isActive ? 'active' : '')

export default function Layout() {
  const nav = useNavigate()
  const role = getRole()
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Гуманітарна логістика</div>
        <nav className="nav">
          <NavLink to="/" end className={linkClass}>
            Огляд
          </NavLink>
          <NavLink to="/warehouses" className={linkClass}>
            Склади
          </NavLink>
          <NavLink to="/cargo" className={linkClass}>
            Вантажі
          </NavLink>
          <NavLink to="/requests" className={linkClass}>
            Заявки
          </NavLink>
          <NavLink to="/transactions" className={linkClass}>
            Транзакції
          </NavLink>
          <NavLink to="/stock" className={linkClass}>
            Залишки
          </NavLink>
          <NavLink to="/forecast" className={linkClass}>
            Прогноз попиту
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            Користувачі
          </NavLink>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ margin: '0.75rem 1rem 0', textAlign: 'left' }}
            onClick={() => {
              logout()
              nav('/login')
            }}
          >
            Вийти {role ? `(${role})` : ''}
          </button>
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
