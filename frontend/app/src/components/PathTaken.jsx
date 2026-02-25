import { useState } from 'react'
import { ratings as ratingsApi } from '../api/index.js'

export default function PathTaken({ path }) {
  const routeId = path.route?.id
  const name = path.route?.name    ?? '—'
  const date = path.date_saved ? new Date(path.date_saved).toLocaleDateString() : '—'
  const time = path.route?.estimated_duration ?? 0
  const budget = path.route?.budget_max ?? 0

  const [score, setScore] = useState(path.user_rating?.score   ?? 0)
  const [hover, setHover] = useState(0)
  const [ratingId, setRatingId] = useState(path.user_rating?.id      ?? null)
  const [comment, setComment] = useState(path.user_rating?.comment ?? '')
  const [saving, setSaving] = useState(false)

  const handleStar = async (star) => {
    if (saving) return
    setSaving(true)
    try {
      if (ratingId) {
        await ratingsApi.update(routeId, ratingId, { score: star, comment })
      } else {
        const res = await ratingsApi.create(routeId, { score: star, comment })
        setRatingId(res.data.id)
      }
      setScore(star)
    } catch {

    } finally {
      setSaving(false)
    }
  }

  const handleCommentBlur = async () => {
    if (!ratingId || saving) return
    setSaving(true)
    try {
      await ratingsApi.update(routeId, ratingId, { score, comment })
    } catch {

    } finally {
      setSaving(false)
    }
  }

  const displayStars = hover || score

  return (
    <tr>
      <td className="path-cell"><span className="cell-icon">◎</span>{name}</td>
      <td>{date}</td>
      <td>{time} min</td>
      <td>₴{budget}</td>
      <td>
        <span
          style={{ fontSize: 18, cursor: 'pointer', whiteSpace: 'nowrap', opacity: saving ? 0.5 : 1 }}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              style={{ color: s <= displayStars ? '#f59e0b' : '#d1d5db' }}
              onMouseEnter={() => setHover(s)}
              onClick={() => handleStar(s)}
            >★</span>
          ))}
        </span>
      </td>
      <td className="comment-cell">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          onBlur={handleCommentBlur}
          placeholder={score ? 'Додати коментар…' : '—'}
          disabled={!score}
          style={{
            border: 'none',
            borderBottom: score ? '1px solid #ddd' : 'none',
            outline: 'none',
            fontSize: 13,
            width: '100%',
            background: 'transparent',
            color: score ? '#333' : '#aaa',
          }}
        />
      </td>
    </tr>
  )
}
