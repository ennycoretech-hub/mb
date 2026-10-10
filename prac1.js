
    let c3
    let g
    
    function ft(tx) {
      tx = +tx
      tx = Math.round(tx)
      let c1 = String(tx)
      //console.log(c1)
      let c2 = c1.trim().split('')
      // console.log(c2)
      let len = c2.length
      //console.log(len)
      c3 = []
      let sum = 0
      for (let i = len - 1; i >= 0; i--) {
        //console.log(i)
        
        sum++
        //console.log(sum)
        if (sum % 3 == 0) {
          if (sum % 3 == 0 && i == 0) {
            c3.push(c2[i])
          } else {
            c3.push(c2[i])
            c3.push(',')
          }
          //console.log(true)
        } else {
          c3.push(c2[i])
        }
        //console.log(c3.reverse())
        //console.log(c3.reverse().join(''))
      }
      let c4 = c3.reverse()
      let c5 = c4.join('')
      //console.log(c5)
      
      h = fe(c5, sum)
      return h
      
    }
    
    function fe(r, y) {
      let j = y
      
      y--
      y--
      let res
      if (r.includes(',')) {
        res = r 
      } else {
        res = r 
      }
      return res
    }
    
    
    
    function fre(c) {
      let yt = false
      let c6a = c.split('')
      let c6 = c6a.reverse()
      let mr = c6.indexOf(',')
      //  console.log(mr)
      //  console.log('len', c.length)
      mr = c.length - mr
      //   console.log(mr)
      // console.log(c6[mr + 2])
      //console.log(c6[mr - 2])
      
      if ((c6[mr - 2]) >= 5 && !(c6[mr - 2] != 9)) {
        c6 = fp(c6)
        //console.error(c6)
      } else if (c6[mr - 2] < 5 && c6[mr - 2] != 0 && c6[mr - 2] != 9) {
        let k = +c6[mr - 2]
        //console.error(k)
        let h = String(+c6[mr - 1])
        
        c6[mr - 1] = h
        //console.error(c6)
      } else if ((c6[mr - 2]) >= 5 && c6[mr + 1] == 9) {
        console.log(c6)
        c6 = fp(c6)
        console.log(c6)
      }
      else {
        if (c6[mr - 2] == 0 && c6[mr - 3] == 0) {
          yt = true
        } else if (c6.length == 5 || c6.length == 9 || c6.length == 13 || c6.length == 17) {
          yt = true
        }
        else {
          
          yt = false
        }
      }
      
      if (yt) {
        c6 = c6.slice(c.length - c.indexOf(','))
        c6.reverse()
        
        
        c6 = c6
      } else {
        console.log(yt)
        c6 = c6.slice(c.length - c.indexOf(',') - 2)
        c6.reverse()
        let c6b = c6.indexOf(',')
        c6[c6b] = '.'
        
        
      }
      let c7 = c6.join('')
      
      return c7
    }
    
    
    function fp(tx) {
      h = String(tx)
      let b = tx
      if (h.includes('.')) {
        //let y = h.split('')
        console.log(y)
        let v = y.indexOf('.')
        console.log(v)
        if (y[v + 2] >= 5) {
          y[v + 1] = String(+y[v + 1] + 1)
        }
        if (v != -1) {
          console.log('added')
          for (let i = y.length; i > v + 2; i--) {
            y.pop()
            console.log(y)
          }
          // b = y.join('')
          
          console.log(`${tx} to ${b}`)
        }
        
      }
      return b
    }
    
   
  
    
    
    
