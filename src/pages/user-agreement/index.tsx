/**
 * 用户服务协议页面
 */

import {ScrollView, Text, View} from '@tarojs/components'

export default function UserAgreement() {
  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-6">
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 text-center">
              <View className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <View className="i-mdi-file-document text-4xl text-blue-600" />
              </View>
              <Text className="text-2xl font-bold text-foreground">用户服务协议</Text>
              <Text className="text-sm text-muted-foreground mt-2 block">更新日期：2025年11月6日</Text>
              <Text className="text-sm text-muted-foreground block">生效日期：2025年11月6日</Text>
            </View>
          </View>

          {/* 协议内容 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 space-y-6 mb-20">
            {/* 欢迎语 */}
            <View className="bg-blue-100 rounded-lg p-4 border border-border">
              <Text className="text-base text-foreground leading-relaxed font-medium">
                欢迎您使用餐饮员工工作旅途操作系统（以下简称"本系统"）！
              </Text>
              <Text className="text-sm text-foreground leading-relaxed mt-3 block">
                在使用本系统之前，请您仔细阅读并充分理解本协议的全部内容。如果您不同意本协议的任何内容，请不要使用本系统。您使用本系统即表示您已阅读、理解并同意接受本协议的全部内容。
              </Text>
            </View>

            {/* 第一条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">1</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">服务说明</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  1.1
                  本系统是一款专为餐饮行业设计的员工全生命周期管理平台，提供招聘管理、入职管理、排班考勤、培训发展、绩效管理、薪酬福利、离职管理等功能。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  1.2 本系统由miaoda-team开发和运营，我们致力于为用户提供优质、稳定、安全的服务。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  1.3 本系统可能会根据业务发展需要，对服务内容进行调整、更新或升级，我们会通过适当方式提前通知用户。
                </Text>
              </View>
            </View>

            {/* 第二条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">2</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">用户注册与账号管理</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  2.1 用户需要通过手机号验证码或微信授权的方式注册并登录本系统。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  2.2
                  用户应当提供真实、准确、完整的个人信息，并及时更新。如因信息不真实、不准确或不完整导致的问题，由用户自行承担。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  2.3
                  用户应当妥善保管账号和密码，不得将账号转让、出借或分享给他人使用。因用户保管不善导致的账号被盗用等问题，由用户自行承担责任。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  2.4 如发现账号被盗用或存在安全隐患，用户应立即通知我们，我们将协助用户采取相应措施。
                </Text>
              </View>
            </View>

            {/* 第三条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">3</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">用户行为规范</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  3.1 用户在使用本系统时，应当遵守以下规范：
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  （1）遵守中华人民共和国相关法律法规；
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  （2）不得利用本系统从事违法违规活动；
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  （3）不得上传、发布含有违法、违规、不良信息的内容；
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  （4）不得侵犯他人的合法权益，包括但不限于知识产权、隐私权等；
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  （5）不得干扰或破坏本系统的正常运行；
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  （6）不得利用技术手段或其他方式窃取他人账号、数据或信息。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  3.2
                  如用户违反上述规范，我们有权采取警告、限制功能、暂停服务、终止服务等措施，并保留追究法律责任的权利。
                </Text>
              </View>
            </View>

            {/* 第四条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">4</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">知识产权</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  4.1
                  本系统的所有内容，包括但不限于文字、图片、图标、界面设计、代码、数据等，均受中华人民共和国著作权法、商标法、专利法等法律法规的保护。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  4.2 未经我们书面许可，用户不得复制、修改、传播、展示、出售本系统的任何内容。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  4.3
                  用户在本系统上传、发布的内容，应当保证拥有相应的权利。如因用户上传、发布的内容侵犯他人权益，由用户自行承担责任。
                </Text>
              </View>
            </View>

            {/* 第五条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">5</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">隐私保护</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  5.1 我们非常重视用户的隐私保护，具体内容请参见《隐私政策》。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  5.2 我们承诺采取合理的技术和管理措施保护用户的个人信息安全。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  5.3 除法律法规规定或用户授权外，我们不会向第三方提供用户的个人信息。
                </Text>
              </View>
            </View>

            {/* 第六条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">6</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">免责声明</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  6.1
                  我们将尽力保证本系统的稳定运行，但不保证服务不会中断或完全没有错误。因不可抗力、网络故障、系统维护等原因导致的服务中断或数据丢失，我们不承担责任。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  6.2 用户因使用本系统而产生的任何直接或间接损失，我们不承担责任，但法律法规另有规定的除外。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  6.3 本系统可能包含第三方链接或服务，我们对第三方的内容、服务质量不承担责任。
                </Text>
              </View>
            </View>

            {/* 第七条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">7</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">协议的变更与终止</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  7.1 我们有权根据业务发展需要修改本协议，修改后的协议将在本系统上公布，并自公布之日起生效。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  7.2 如用户不同意修改后的协议，可以停止使用本系统；如用户继续使用本系统，视为接受修改后的协议。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  7.3 用户可以随时注销账号并终止使用本系统。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  7.4 如用户违反本协议，我们有权终止向用户提供服务。
                </Text>
              </View>
            </View>

            {/* 第八条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">8</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">争议解决</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  8.1 本协议的订立、执行、解释及争议解决均适用中华人民共和国法律。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">
                  8.2
                  如双方就本协议内容或执行发生争议，应友好协商解决；协商不成的，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
                </Text>
              </View>
            </View>

            {/* 第九条 */}
            <View>
              <View className="flex items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Text className="text-foreground font-bold text-sm">9</Text>
                </View>
                <Text className="text-lg font-bold text-foreground">联系我们</Text>
              </View>
              <View className="pl-10 space-y-2">
                <Text className="text-sm text-foreground leading-relaxed block">
                  如您对本协议有任何疑问、意见或建议，请通过以下方式联系我们：
                </Text>
                <Text className="text-sm text-foreground leading-relaxed block">运营方：miaoda-team</Text>
                <Text className="text-sm text-foreground leading-relaxed block">联系方式：通过系统内反馈功能联系</Text>
              </View>
            </View>

            {/* 结束语 */}
            <View className="mt-6 pt-6 border-t-2 border-border">
              <View className="bg-blue-100 rounded-lg p-4 text-center border border-border">
                <Text className="text-base text-foreground font-bold leading-relaxed">
                  感谢您使用餐饮员工工作旅途操作系统！
                </Text>
                <Text className="text-sm text-muted-foreground mt-2 block">本协议最终解释权归miaoda-team所有</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
