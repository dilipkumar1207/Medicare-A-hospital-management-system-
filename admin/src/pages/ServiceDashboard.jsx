import React, { useMemo, useState } from 'react'
import { serviceDashboardStyles as sd } from '../assets/dummyStyles'
import { useAdminData } from '../context/AdminDataContext'
import {
  SearchIcon, GridIcon, CheckCircleIcon, XCircleIcon, RupeeIcon, RefreshIcon,
} from '../components/Icons'

const PAGE_SIZE = 6

function ServiceDashboard() {
  const { services, serviceAppointments } = useAdminData()
  const [search, setSearch] = useState("")
  const [visible, setVisible] = useState(PAGE_SIZE)

  const stats = useMemo(() => {
    const available = services.filter((s) => s.available).length
    const unavailable = services.length - available
    const earnings = serviceAppointments
      .filter((a) => a.status === "Completed")
      .reduce((sum, a) => sum + a.fees, 0)
    return [
      { label: "Total Services", value: services.length, icon: GridIcon },
      { label: "Available", value: available, icon: CheckCircleIcon },
      { label: "Unavailable", value: unavailable, icon: XCircleIcon },
      { label: "Bookings", value: serviceAppointments.length, icon: GridIcon },
      { label: "Earnings", value: `₹${earnings}`, icon: RupeeIcon },
    ]
  }, [services, serviceAppointments])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return services
    return services.filter((s) => s.name.toLowerCase().includes(q))
  }, [services, search])

  const rows = filtered.slice(0, visible)

  const bookingsFor = (serviceId) => serviceAppointments.filter((a) => a.serviceId === serviceId).length

  return (
    <div className={sd.container}>
      <div className={sd.innerContainer}>
        <div className={sd.header.container}>
          <div>
            <h1 className={sd.header.title}>Service Dashboard</h1>
            <p className={sd.header.subtitle}>Overview of all hospital services</p>
          </div>
          <div className={sd.refresh.container}>
            <span className={sd.refresh.countText}>{services.length} services</span>
            <button className={sd.refresh.button(false)}>
              <RefreshIcon className="w-4 h-4 inline mr-1" /> Refresh
            </button>
          </div>
        </div>

        <div className={sd.statGrid}>
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className={sd.statCard.container}>
              <div className={sd.statCard.iconContainer}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={sd.statCard.label}>{label}</div>
                <div className={sd.statCard.value}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={sd.search.container}>
          <div className={sd.search.inputContainer}>
            <SearchIcon className="w-4 h-4 text-blue-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className={sd.search.input}
            />
          </div>
        </div>

        <div className={sd.table.container}>
          {/* Desktop header */}
          <div className={sd.table.headerLg}>
            <span className={sd.table.headerTextLg(4)}>Service</span>
            <span className={sd.table.headerTextLg(2)}>Price</span>
            <span className={sd.table.headerTextLg(2)}>Bookings</span>
            <span className={sd.table.headerTextLg(2)}>Slots</span>
            <span className={sd.table.headerTextLg(2)}>Status</span>
          </div>
          {/* Tablet header */}
          <div className={sd.table.headerMd}>
            <span className={sd.table.headerText}>Service</span>
            <span className={sd.table.headerText}>Price</span>
            <span className={sd.table.headerText}>Bookings</span>
            <span className={sd.table.headerText}>Slots</span>
            <span className={sd.table.headerText}>Status</span>
          </div>

          <div className={sd.table.body}>
            {rows.length === 0 && <div className={sd.states.empty}>No services found.</div>}
            {rows.map((s) => {
              const slotCount = s.schedule?.reduce((sum, sc) => sum + sc.slots.length, 0) || 0
              return (
                <div key={s.id} className={sd.table.row}>
                  {/* Desktop */}
                  <div className={sd.table.desktopView}>
                    <div className={sd.table.desktopCell(4)}>
                      <div className="flex items-center gap-3">
                        <div className={sd.table.desktopImage}>
                          <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={sd.table.desktopServiceName}>{s.name}</span>
                      </div>
                    </div>
                    <div className={sd.table.desktopCenterCell(2)}>₹{s.price}</div>
                    <div className={sd.table.desktopCenterCell(2)}>{bookingsFor(s.id)}</div>
                    <div className={sd.table.desktopCenterCell(2)}>{slotCount}</div>
                    <div className={sd.table.desktopCenterCell(2)}>
                      <span className={`text-xs px-3 py-1 rounded-full ${s.available ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"}`}>
                        {s.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>

                  {/* Tablet */}
                  <div className={sd.table.tabletView}>
                    <div className="flex items-center gap-3">
                      <div className={sd.table.tabletImage}>
                        <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div className={sd.table.tabletTextContainer}>
                        <div className={sd.table.tabletServiceName}>{s.name}</div>
                        <div className={sd.table.tabletPrice}>₹{s.price}</div>
                      </div>
                    </div>
                    <div className={sd.table.tabletCell}>{bookingsFor(s.id)}</div>
                    <div className={sd.table.tabletCell}>{slotCount}</div>
                    <div className={sd.table.tabletCell}>{s.available ? "Available" : "Unavailable"}</div>
                  </div>

                  {/* Mobile */}
                  <div className={sd.table.mobileView}>
                    <div className={sd.table.mobileServiceHeader}>
                      <div className="flex items-center gap-3">
                        <div className={sd.table.mobileImage}>
                          <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={sd.table.mobileServiceName}>{s.name}</span>
                      </div>
                      <span>₹{s.price}</span>
                    </div>
                    <div className={sd.table.mobileStatsContainer}>
                      <span className={sd.table.mobileStatItem()}>Bookings: {bookingsFor(s.id)}</span>
                      <span className={sd.table.mobileStatItem()}>Slots: {slotCount}</span>
                      <span className={sd.table.mobileStatItem()}>{s.available ? "Available" : "Unavailable"}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length > visible && (
            <div className={sd.showMore.container}>
              <button className={sd.showMore.button} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Show More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceDashboard
